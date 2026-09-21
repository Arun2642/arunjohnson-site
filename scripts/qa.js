async function loadQA() {
  const response = await fetch('data/qa.json');
  if (!response.ok) {
    throw new Error('Failed to load Q&A content.');
  }
  return response.json();
}

function renderQA(items) {
  const container = document.getElementById('qa-options');
  const answerBox = document.getElementById('qa-answer');

  items.forEach((item) => {
    const button = document.createElement('button');
    button.className = 'qa-option';
    button.type = 'button';
    button.innerHTML = `<span class="qa-label">${item.id}</span><span>${item.question}</span>`;
    button.addEventListener('click', () => {
      answerBox.innerHTML = `<h3>${item.id}. ${item.question}</h3><p>${item.answer}</p>`;
      document.querySelectorAll('.qa-option').forEach((opt) => opt.classList.remove('active'));
      button.classList.add('active');
    });
    container.appendChild(button);
  });
}

function openDraftEmail() {
  const input = document.getElementById('free-question');
  const question = input.value.trim();

  if (!question) return;

  const subject = encodeURIComponent('Website Q&A Question');
  const body = encodeURIComponent(`Hi Arun,\n\nI have a question from your website:\n\n${question}\n\nThanks!`);
  window.location.href = `mailto:arun2642@gmail.com?subject=${subject}&body=${body}`;
  input.value = '';
}

function initFreeResponse() {
  const input = document.getElementById('free-question');
  const sendBtn = document.getElementById('send-question');

  sendBtn.addEventListener('click', openDraftEmail);
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      openDraftEmail();
    }
  });
}

(async function init() {
  try {
    const items = await loadQA();
    renderQA(items);
  } catch (error) {
    const answerBox = document.getElementById('qa-answer');
    answerBox.innerHTML = '<p>Sorry—Q&A content is temporarily unavailable.</p>';
  }

  initFreeResponse();
})();
