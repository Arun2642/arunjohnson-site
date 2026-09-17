(function () {
  const initialBlurb = document.getElementById('profile-blurb').innerHTML.trim();
  const state = {
    data: null,
    activeQuestion: null,
    currentBlurbId: null,
    nodesById: new Map(),
    visibleQuestions: [],
    isTransitioning: false
  };

  const optionsEl = document.getElementById('question-options');
  const blurbEl = document.getElementById('profile-blurb');
  const resetButton = document.getElementById('reset-questions');
  const freeQuestionForm = document.getElementById('free-question-form');
  const freeQuestionInput = document.getElementById('free-question');
  const emailDraftForm = document.getElementById('email-draft-form');
  const closeEmailDraft = document.getElementById('close-email-draft');
  const visitorEmailInput = document.getElementById('visitor-email');
  const draftMessageInput = document.getElementById('draft-message');
  const emailStatus = document.getElementById('email-status');

  function getNode(id) {
    return state.nodesById.get(id);
  }

  function outgoingEdges(nodeId, kind) {
    return state.data.edges
      .filter((edge) => edge.fromNodeId === nodeId && edge.kind === kind)
      .sort((left, right) => (left.order || 0) - (right.order || 0));
  }

  function visibleQuestionsForBlurb(blurbId) {
    return outgoingEdges(blurbId, 'shows_question')
      .map((edge) => getNode(edge.toNodeId))
      .filter(Boolean);
  }

  function appendFormattedText(parent, text) {
    const pattern = /(!?\[([^\]]*)\]\(([^)]+)\))/g;
    let lastIndex = 0;
    let match;

    while ((match = pattern.exec(text)) !== null) {
      parent.append(document.createTextNode(text.slice(lastIndex, match.index)));
      const isImage = match[1].startsWith('!');
      const label = match[2];
      const url = match[3].trim();

      if (isSafeUrl(url)) {
        if (isImage) {
          const image = document.createElement('img');
          image.src = url;
          image.alt = label;
          image.loading = 'lazy';
          parent.appendChild(image);
        } else {
          const link = document.createElement('a');
          link.href = url;
          link.textContent = label || url;
          if (/^https?:\/\//i.test(url)) {
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
          }
          parent.appendChild(link);
        }
      } else {
        parent.append(document.createTextNode(match[1]));
      }

      lastIndex = pattern.lastIndex;
    }

    parent.append(document.createTextNode(text.slice(lastIndex)));
  }

  function isSafeUrl(url) {
    return /^(https?:\/\/|mailto:|\/|\.\/|\.\.\/)/i.test(url);
  }

  function answerForQuestion(questionId) {
    const answerEdge = outgoingEdges(questionId, 'answers_with')[0];
    return answerEdge ? getNode(answerEdge.toNodeId) : null;
  }

  function makeButton(question, index) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'question-option';
    button.dataset.questionId = question._id;

    const label = document.createElement('span');
    label.className = question.label ? 'option-letter' : 'option-letter subtle';
    label.textContent = question.label || String(index + 1);
    button.appendChild(label);

    const text = document.createElement('span');
    text.textContent = question.text;
    button.appendChild(text);
    button.addEventListener('click', () => selectQuestion(question, button));
    return button;
  }

  function renderQuestions(questions, isRoot = false) {
    state.visibleQuestions = questions;
    optionsEl.classList.toggle('root-options', isRoot);
    optionsEl.replaceChildren();
    questions.forEach((question, index) => {
      optionsEl.appendChild(makeButton(question, index));
    });
  }

  async function typeBlurb(blurb, isRoot = false) {
    blurbEl.replaceChildren();
    blurbEl.classList.add('is-typing');

    for (const [index, paragraph] of blurb.paragraphs.entries()) {
      const p = document.createElement('p');
      if (isRoot && index === 0) {
        p.className = 'intro-greeting';
      }
      blurbEl.appendChild(p);
      await typeText(p, paragraph);
      p.textContent = '';
      appendFormattedText(p, paragraph);
    }

    blurbEl.classList.remove('is-typing');
  }

  function typeText(element, text) {
    const interval = 10;
    return new Promise((resolve) => {
      let index = 0;
      const timer = setInterval(() => {
        element.textContent += text.slice(index, index + 3);
        index += 3;
        if (index >= text.length) {
          clearInterval(timer);
          resolve();
        }
      }, interval);
    });
  }

  async function selectQuestion(question, button) {
    if (state.isTransitioning) {
      return;
    }

    state.isTransitioning = true;
    button.classList.add('is-selected');
    await delay(170);
    await showQuestion(question);
    state.isTransitioning = false;
  }

  async function showQuestion(question) {
    state.activeQuestion = question;
    const answer = answerForQuestion(question._id);
    if (!answer) {
      state.isTransitioning = false;
      return;
    }

    state.currentBlurbId = answer._id;
    await typeBlurb(answer);
    renderQuestions(visibleQuestionsForBlurb(answer._id), false);
    resetButton.hidden = false;
  }

  function resetQuestions() {
    state.activeQuestion = null;
    state.isTransitioning = false;
    blurbEl.classList.remove('is-typing');
    const root = getNode(state.data.rootNodeId);
    if (!root) {
      blurbEl.innerHTML = initialBlurb;
      optionsEl.textContent = 'Questions are unavailable right now.';
      return;
    }

    state.currentBlurbId = root._id;
    renderRootBlurb(root);
    renderQuestions(visibleQuestionsForBlurb(root._id), true);
    resetButton.hidden = true;
  }

  function renderRootBlurb(root) {
    blurbEl.replaceChildren();
    if (!root) {
      blurbEl.innerHTML = initialBlurb;
      return;
    }

    root.paragraphs.forEach((paragraph, index) => {
      const p = document.createElement('p');
      if (index === 0) {
        p.className = 'intro-greeting';
      }
      appendFormattedText(p, paragraph);
      blurbEl.appendChild(p);
    });
  }

  function delay(milliseconds) {
    return new Promise((resolve) => {
      setTimeout(resolve, milliseconds);
    });
  }

  function autoresizeInput() {
    freeQuestionInput.style.height = 'auto';
    freeQuestionInput.style.height = `${freeQuestionInput.scrollHeight}px`;
  }

  function showEmailDraft(question) {
    draftMessageInput.value = `Hi Arun,\n\n${question}\n\n`;
    emailStatus.textContent = '';
    emailDraftForm.hidden = false;
    visitorEmailInput.focus();
  }

  function hideEmailDraft() {
    emailDraftForm.hidden = true;
    emailStatus.textContent = '';
  }

  async function loadQuestions() {
    const sources = [
      document.body.dataset.qnaApi,
      document.body.dataset.qnaStatic
    ].filter(Boolean);

    if (!sources.length) {
      sources.push('/api/qna/public');
    }

    let lastError = null;
    for (const source of sources) {
      try {
        const response = await fetch(source, { cache: 'no-store' });
        if (!response.ok) {
          throw new Error(`Unable to load Q&A graph: ${response.status}`);
        }

        const data = await response.json();
        if (!data || !Array.isArray(data.nodes) || !Array.isArray(data.edges)) {
          throw new Error('Q&A graph is missing nodes or edges');
        }

        state.data = data;
        state.nodesById = new Map(state.data.nodes.map((node) => [node._id, node]));

        const root = getNode(state.data.rootNodeId);
        if (!root) {
          throw new Error('Root Q&A blurb is missing');
        }

        state.currentBlurbId = root._id;
        renderRootBlurb(root);
        renderQuestions(visibleQuestionsForBlurb(root._id), true);
        return;
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError || new Error('Q&A content is unavailable');
  }

  resetButton.addEventListener('click', resetQuestions);
  closeEmailDraft.addEventListener('click', hideEmailDraft);

  freeQuestionInput.addEventListener('input', autoresizeInput);
  freeQuestionInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      freeQuestionForm.requestSubmit();
    }
  });

  document.addEventListener('keydown', (event) => {
    const activeElement = document.activeElement;
    const isTyping = activeElement && ['INPUT', 'TEXTAREA'].includes(activeElement.tagName);
    if (isTyping || state.isTransitioning) {
      return;
    }

    const key = event.key.toLowerCase();
    if (!/^[a-d]$/.test(key)) {
      return;
    }

    const index = key.charCodeAt(0) - 97;
    const question = state.visibleQuestions[index];
    if (!question) {
      return;
    }

    event.preventDefault();
    const button = optionsEl.querySelectorAll('.question-option')[index];
    selectQuestion(question, button);
  });

  freeQuestionForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const question = freeQuestionInput.value.trim();
    if (!question) {
      freeQuestionInput.focus();
      return;
    }

    showEmailDraft(question);
  });

  emailDraftForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const endpoint = state.data.formEndpoint;
    if (!endpoint) {
      emailStatus.textContent = 'Email sending is not configured yet.';
      return;
    }

    const submitButton = emailDraftForm.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    emailStatus.textContent = 'Sending...';

    const payload = new FormData();
    payload.append('email', visitorEmailInput.value.trim());
    payload.append('_replyto', visitorEmailInput.value.trim());
    payload.append('_subject', 'Question from arunjohnson.com');
    payload.append('_captcha', 'false');
    payload.append('message', draftMessageInput.value.trim());

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        body: payload,
        headers: {
          Accept: 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Email service returned ${response.status}`);
      }

      emailStatus.textContent = 'Sent. Thanks for the question.';
      freeQuestionInput.value = '';
      emailDraftForm.reset();
      setTimeout(hideEmailDraft, 1400);
    } catch (error) {
      emailStatus.textContent = 'Could not send yet. Please try again in a moment.';
    } finally {
      submitButton.disabled = false;
    }
  });

  loadQuestions().catch(() => {
    optionsEl.textContent = 'Questions are unavailable right now.';
  });
})();
