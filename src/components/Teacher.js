import React, { useState, useEffect } from "react";
import io from "socket.io-client";

import "./Teacher.css"; // Import CSS file

const socket = io(process.env.REACT_APP_BACKEND_URL, {
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 0,
});
function Teacher() {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", "", "", ""]);
  const [correctOption, setCorrectOption] = useState(0);
  const [currentPollResults, setCurrentPollResults] = useState(null);
  const [previousPollResults, setPreviousPollResults] = useState([]);
  const [isQuestionActive, setIsQuestionActive] = useState(false);
  const [allStudentsAnswered, setAllStudentsAnswered] = useState(false);

  useEffect(() => {
    socket.on("pollResults", (results) => {
      setCurrentPollResults(results);
      setAllStudentsAnswered(true);
    });

    return () => {
      socket.off("pollResults");
    };
  }, []);

  useEffect(() => {
    if (currentPollResults) {
      const questionOne = (currentPollResults && currentPollResults.allValues && currentPollResults.allValues.questionData && currentPollResults.allValues.questionData.question) || "";
      const isQuestionAlreadyExists = previousPollResults.some(result =>
        result.allValues.questionData.question === questionOne
      );
      if (!isQuestionAlreadyExists) {
        setPreviousPollResults(prevResults => [currentPollResults, ...prevResults]);
      }
    }
  }, [question]);
  

  const handleQuestionSubmission = () => {
    // Check if the question or any option is empty
    if (!question.trim() || options.some((option) => !option.trim())) {
      alert("Please fill in both the question and all options.");
      return;
    }

    // Check for duplicate options
    const uniqueOptions = new Set(options.map((option) => option.trim()));
    if (uniqueOptions.size !== options.length) {
      alert("Please provide unique options.");
      return;
    }

    // Check if correctOption is within bounds
    if (correctOption < 0 || correctOption >= options.length) {
      alert("Please select a valid correct option.");
      return;
    }
    


    const questionData = {
      question,
      options,
      correctOption,
    };

    console.log("Question data:", questionData);
    socket.emit("newQuestion", questionData);
    setIsQuestionActive(true);
    setQuestion("");
    setOptions(["", "", "", ""]);
    setCorrectOption(0);
    setAllStudentsAnswered(false);

    // Update pollResultsHistory
    setCurrentPollResults(null);
  };

  const calculatePercentage = (optionIndex, results) => {
    if (!results || !results.pollResults) return "NAN";
    const totalResponses =
      results && results.pollResults.reduce((acc, count) => acc + count, 0);
    if (totalResponses === 0) return 0;
    const percentage = (
      (results.pollResults[optionIndex] / totalResponses) *
      100
    ).toFixed(2);
    return results &&
      results.allValues &&
      results.allValues.questionData &&
      results.allValues.questionData.options &&
      results.allValues.questionData.options[optionIndex]
      ? {
          text: `${results.allValues.questionData.options[optionIndex]}`,
          percentage: `${percentage}%`,
          correct: optionIndex === results.allValues.questionData.correctOption,
        }
      : "NAN";
  };

  return (
    <>
      <div className="teacher-container">
        <h2 className="teacher-title">Teacher Panel</h2>
        {!isQuestionActive || allStudentsAnswered ? (
          <div className="question-section">
            <textarea
              className="question-textarea"
              rows="4"
              cols="50"
              placeholder="Enter your question..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
            ></textarea>
            <br />
            <div className="option-section-one" key="labels">
              <div className="all-options">Options</div>
              <div className="correct-option">Is Correct ?</div>
            </div>

            {options.map((option, index) => (
              <div className="option-section" key={index}>
                <input
                  type="text"
                  className="option-input"
                  placeholder={`Option ${index + 1}`}
                  value={option}
                  onChange={(e) => {
                    const newOptions = [...options];
                    newOptions[index] = e.target.value;
                    setOptions(newOptions);
                  }}
                />

                <input
                  type="radio"
                  className="correct-option-radio"
                  name="correctOption"
                  checked={correctOption === index}
                  onChange={() => setCorrectOption(index)}
                />
              </div>
            ))}
            <button
              className="ask-question-button"
              onClick={handleQuestionSubmission}
            >
              Ask Question
            </button>
          </div>
        ) : (
          <p className="question-instruction">
            You cannot ask a new question until you receive the results of the
            previous one.
          </p>
        )}
      </div>
      <div class="teacher-container">
        {currentPollResults &&
        currentPollResults.pollResults &&
        currentPollResults.pollResults.length > 0 ? (
          <div class="current-poll-results-section">
            <h3 class="poll-results-title">Current Poll Result</h3>
            <h4 class="poll-question">
              {"Question : "}{" "}
              {currentPollResults.allValues.questionData.question}
            </h4>
            {currentPollResults.pollResults.map((count, index) => (
              <div class="poll-result-container" key={index}>
                <div
                  class="poll-result-bar"
                  style={{
                    backgroundColor: calculatePercentage(
                      index,
                      currentPollResults
                    ).correct
                      ? "green"
                      : "red",
                  }}
                >
                  <p class="poll-result-text">
                    {calculatePercentage(index, currentPollResults).text}
                  </p>
                  <p class="poll-result-percentage">
                    {calculatePercentage(index, currentPollResults).percentage}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p class="no-poll-results">No poll results available.</p>
        )}
      </div>
      <div class="teacher-container">
        {previousPollResults.length > 0 && (
          <div className="current-poll-results-section">
            <h3 className="poll-results-title">Previous Poll Results</h3>
            {previousPollResults.map((result, index) => (
              <div key={index} className="previous-poll-result">
                <h4 className="poll-question">
                  Question: {result.allValues.questionData.question}
                </h4>
                {result.pollResults.map((count, index) => (
                  <div className="poll-result-container" key={index}>
                    <div
                      className="poll-result-bar"
                      style={{
                        backgroundColor: calculatePercentage(index, result)
                          .correct
                          ? "green"
                          : "red",
                      }}
                    >
                      <p className="poll-result-text">
                        {calculatePercentage(index, result).text}
                      </p>
                      <p className="poll-result-percentage">
                        {calculatePercentage(index, result).percentage}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export default Teacher;

