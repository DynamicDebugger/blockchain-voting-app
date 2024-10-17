const web3 = new Web3(window.ethereum);
let account;
const CONTRACT_ADDR = "0xd9145cce52d386f254917e481eb44e9943f39138";
const CONTRACT_ABI = [
  {
    inputs: [
      { internalType: "string[]", name: "_candidateName", type: "string[]" },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    inputs: [
      { internalType: "uint256", name: "_candidateId", type: "uint256" },
    ],
    name: "vote",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "candidateCount",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    name: "candidates",
    outputs: [
      { internalType: "uint256", name: "id", type: "uint256" },
      { internalType: "string", name: "name", type: "string" },
      { internalType: "uint256", name: "voteCount", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "", type: "address" }],
    name: "hasVoted",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
];

const contract = new web3.eth.Contract(CONTRACT_ABI, CONTRACT_ADDR);

// Candidates and totalVotes will be fetched from the contract
let candidates = [];
let totalVotes = 0;

document.addEventListener("DOMContentLoaded", async function () {
  // Connect to MetaMask
  if (window.ethereum) {
    await ethereum
      .request({ method: "eth_requestAccounts" })
      .then((accounts) => {
        account = accounts[0];
        console.log("Connected account:", account);
      });
  } else {
    alert("Please install MetaMask to use this application.");
    return;
  }

  // Fetch and display candidates and votes
  await fetchCandidates();
  await fetchTotalVotes();
  renderCandidates();
  renderVotingOptions();
});

async function fetchCandidates() {
  try {
    const candidateCount = await contract.methods.candidateCount().call();
    candidates = [];

    for (let i = 1; i <= candidateCount; i++) {
      const candidate = await contract.methods.candidates(i).call();
      candidates.push({
        id: candidate.id,
        name: candidate.name,
        voteCount: parseInt(candidate.voteCount),
      });
    }
  } catch (error) {
    showStatus("Failed to fetch candidates. Please try again later.", "error");
  }
}

async function fetchTotalVotes() {
  try {
    totalVotes = 0;
    for (const candidate of candidates) {
      totalVotes += candidate.voteCount;
    }
  } catch (error) {
    console.error("Failed to fetch total votes:", error);
  }
}

function renderCandidates() {
  const tableBody = document.getElementById("candidatesTable");
  tableBody.innerHTML = "";
  candidates.forEach((candidate) => {
    const row = tableBody.insertRow();
    row.insertCell(0).textContent = candidate.name;
    row.insertCell(1).textContent = candidate.voteCount;
    row.insertCell(2).textContent =
      totalVotes > 0
        ? `${((candidate.voteCount / totalVotes) * 100).toFixed(2)}%`
        : "0%";
  });
}

function renderVotingOptions() {
  const optionsContainer = document.getElementById("candidateOptions");
  optionsContainer.innerHTML = "";
  candidates.forEach((candidate) => {
    const label = document.createElement("label");
    label.innerHTML = `
      <input type="radio" name="candidate" value="${candidate.id}">
      ${candidate.name}
    `;
    optionsContainer.appendChild(label);
  });
}

async function handleVote(event) {
  event.preventDefault();
  const form = event.target;
  const selectedCandidate = form.elements.candidate.value;

  if (!selectedCandidate) {
    showStatus("Please select a candidate before voting.", "error");
    return;
  }

  try {
    await submitVote(parseInt(selectedCandidate, 10));
    showStatus("Your vote has been submitted successfully!", "success");
    await fetchCandidates();
    await fetchTotalVotes();
    renderCandidates();
    form.reset();
  } catch (error) {
    showStatus("Failed to submit your vote. Please try again.", "error");
  }
}


function showStatus(message, type) {
  const statusElement = document.getElementById("statusMessage");
  statusElement.textContent = message;
  statusElement.className = type;
}

document.getElementById("voteForm").addEventListener("submit", handleVote);
