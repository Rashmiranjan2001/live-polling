import React, { useState, useEffect } from "react";
import io from "socket.io-client";
import "./Student.css"; // Import the CSS file

const socket = io(process.env.REACT_APP_BACKEND_URL, {
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 0,
});

function Student() {
  const storedName = sessionStorage.getItem("studentName");
  const [studentName, setStudentName] = useState(storedName || "");
  const [questionData, setQuestionData] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [nameSubmitted, setNameSubmitted] = useState(Boolean(storedName));
  const [answered, setAnswered] = useState(false);
  const [pollResults, setPollResults] = useState(null);
  const [submissionDisabled, setSubmissionDisabled] = useState(false);

  useEffect(() => {
    socket.on("newQuestion", (data) => {
      setQuestionData(data);
      setSelectedOption(null);
      setShowResults(false);
      setAnswered(false); // Reset answered status on new question
      setSubmissionDisabled(false); // Enable submission for the new question
    });

    socket.on("pollResults", (results) => {
      setPollResults(results);
    });

    return () => {
      socket.off("newQuestion");
      socket.off("pollResults");
    };
  }, []);

  const handleNameSubmit = (e) => {
    e.preventDefault();
    if (studentName.trim() !== "") {
      setNameSubmitted(true);
      sessionStorage.setItem("studentName", studentName);
    }
  };

  const handleOptionSelect = (index) => {
    if (!answered) {
      setSelectedOption(index);
    }
    setIsCorrect(questionData && questionData.correctOption === index);
  };

  const handleAnswerSubmission = () => {
    if (selectedOption === null || selectedOption === undefined || answered) {
      alert("Please select One option");
      return;
    }

    socket.emit("submitAnswer", {
      option: selectedOption,
      studentName: studentName,
      questionData: questionData,
    });
    setShowResults(true);
    setAnswered(true);
    setSubmissionDisabled(true); // Disable further submissions for this question
  };

  if (!nameSubmitted) {
    return (
      <div class="name-form">
        <h3>Please Enter Your Name:</h3>
        <form onSubmit={handleNameSubmit}>
          <input
            type="text"
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
          />
          <div className="submit-on">
            <button type="submit">Submit</button>
          </div>{" "}
        </form>
      </div>
    );
  }

  return (
    // Inside the Student component
    // Inside the Student component
    <>
      <div className="student-container">
        {/* Header Section */}
        <div className="header">
          <h2>Welcome - {studentName}</h2>
        </div>

        {/* Name Submission Form */}
        {!nameSubmitted && (
          <div class="name-form">
            <h3>Enter Your Name:</h3>
            <form onSubmit={handleNameSubmit}>
              <input
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
              />
              <button type="submit">Submit</button>
            </form>
          </div>
        )}

        {/* Question Display */}
        {questionData ? (
          <div className="question-container">
            <h6 className="question">
              {" "}
              {"Question :"} {questionData.question}
            </h6>
            <div className="option-container">
              {questionData.options.map((option, index) => (
                <label key={index} className="option">
                  <input
                    type="radio"
                    name="options"
                    checked={selectedOption === index}
                    onChange={() => handleOptionSelect(index)}
                    disabled={answered}
                  />
                  {option}
                </label>
              ))}
            </div>
            <button
              className="answer-button"
              onClick={handleAnswerSubmission}
              disabled={submissionDisabled}
            >
              Submit Answer
            </button>
          </div>
        ) : (
          <div className="question-container">
            <p className="question-not-available" >Live question will appear once teacher posts</p>
          </div>
        )}

        {/* Result Container */}
        {showResults && (
          <div className="result-container">
            <p
              className={
                isCorrect ? "result correct-answer" : "result incorrect-answer"
              }
            >
              {isCorrect ? "Well Done, Right Answer" : "Wrong Answer"}
            </p>
          </div>
        )}
      </div>

      <div className="student-container">
        {/* Poll Results */}
        {showResults && pollResults && (
          <div class="current-poll-results-section">
            <h3 class="poll-results-title">Poll Result</h3>
            <h4 class="poll-question">
              {"Question : "} {pollResults.allValues.questionData.question}
            </h4>
            {pollResults.pollResults.map((count, index) => (
              <div class="poll-result-container" key={index}>
                <div
                  class="poll-result-bar"
                  style={{
                    backgroundColor: calculatePercentage(index, pollResults)
                      .correct
                      ? "green"
                      : "red",
                  }}
                >
                  <p class="poll-result-text">
                    {calculatePercentage(index, pollResults).text}
                  </p>
                  <p class="poll-result-percentage">
                    {calculatePercentage(index, pollResults).percentage}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );

  function calculatePercentage(optionIndex) {
    console.log("Choosen option by student is ", pollResults.allValues.option);
    console.log(
      "Correct option is ",
      pollResults.allValues.questionData.correctOption
    );
    if (!pollResults || !pollResults.pollResults) return "NAN";

    const totalResponses = pollResults.pollResults.reduce(
      (acc, count) => acc + count,
      0
    );
    if (totalResponses === 0) return 0;

    const percentage = (
      (pollResults.pollResults[optionIndex] / totalResponses) *
      100
    ).toFixed(2);

    return pollResults &&
      pollResults.allValues &&
      pollResults.allValues.questionData &&
      pollResults.allValues.questionData.options &&
      pollResults.allValues.questionData.options[optionIndex]
      ? {
        text: `${pollResults.allValues.questionData.options[optionIndex]}`,
        percentage: `${percentage}%`,
        correct: optionIndex === pollResults.allValues.questionData.correctOption,
      }
      : "NAN";
  }
}

export default Student;
