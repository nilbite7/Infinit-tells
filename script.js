const contribution = document.getElementById('contribution');
const charCount = document.getElementById('charCount');
const cost = document.getElementById('cost');
const payAndSubmit = document.getElementById('payAndSubmit');

contribution.addEventListener('input', () => {
  const chars = contribution.value.length;
  charCount.textContent = chars;
  cost.textContent = (chars * 10).toFixed(2); // ₹10 per character
});

payAndSubmit.addEventListener('click', async () => {
  const text = contribution.value.trim();
  const username = document.getElementById('username').value.trim() || "Anonymous";
  if (text.length === 0) return alert('Please write something!');

  const res = await fetch('/create-order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, username })
  });
  const { paymentLink } = await res.json();
  window.location.href = paymentLink;
});

async function loadStory() {
  const res = await fetch('/story');
  const data = await res.json();
  document.getElementById('story').textContent = data.story;
  updateLeaderboard(data.leaderboard);
  updateRecent(data.recent);
}

function updateLeaderboard(leaderboard) {
  const lb = document.getElementById('leaderboard');
  lb.innerHTML = leaderboard.map(u => `<p>${u.username}: ${u.chars} chars</p>`).join('');
}

function updateRecent(recent) {
  const rw = document.getElementById('recentWriters');
  rw.innerHTML = recent.map(u => `<p>${u.username} added ${u.chars} chars</p>`).join('');
}

loadStory();