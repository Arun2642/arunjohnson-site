(function () {
  const initialBlurb = document.getElementById('profile-blurb').innerHTML.trim();
  const state = {
    data: null,
    activeQuestion: null,
    currentBlurbId: null,
    nodesById: new Map(),
    visibleQuestions: [],
    blurbHistory: [],
    isTransitioning: false
  };

  const optionsEl = document.getElementById('question-options');
  const blurbEl = document.getElementById('profile-blurb');
  const lastQuestionEl = document.getElementById('last-question');
  const backButton = document.getElementById('back-question');
  const resetButton = document.getElementById('reset-questions');
  const freeQuestionForm = document.getElementById('free-question-form');
  const freeQuestionInput = document.getElementById('free-question');
  const emailDraftForm = document.getElementById('email-draft-form');
  const closeEmailDraft = document.getElementById('close-email-draft');
  const visitorEmailInput = document.getElementById('visitor-email');
  const draftMessageInput = document.getElementById('draft-message');
  const emailStatus = document.getElementById('email-status');
  const menuToggle = document.getElementById('site-menu-toggle');
  const siteMenu = document.getElementById('site-menu');

  function setMenuOpen(isOpen) {
    if (!menuToggle || !siteMenu) {
      return;
    }

    siteMenu.hidden = !isOpen;
    document.body.classList.toggle('menu-open', isOpen);
    menuToggle.setAttribute('aria-expanded', String(isOpen));
    menuToggle.setAttribute('aria-label', isOpen ? 'Close site menu' : 'Open site menu');
    menuToggle.querySelector('i').className = isOpen ? 'fa-solid fa-xmark' : 'fa-solid fa-bars';
  }

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

  const richTextTags = new Set([
    'p', 'br', 'strong', 'b', 'em', 'i', 'u', 'h2', 'h3', 'ul', 'ol', 'li',
    'blockquote', 'a', 'img', 'div', 'span'
  ]);

  function appendRichHtml(parent, html) {
    const parsed = new DOMParser().parseFromString(html, 'text/html');
    const fragment = document.createDocumentFragment();

    function appendNode(source, target) {
      if (source.nodeType === Node.TEXT_NODE) {
        target.appendChild(document.createTextNode(source.textContent));
        return;
      }

      if (source.nodeType !== Node.ELEMENT_NODE) {
        return;
      }

      const tag = source.tagName.toLowerCase();
      if (!richTextTags.has(tag)) {
        source.childNodes.forEach((child) => appendNode(child, target));
        return;
      }

      if (tag === 'img') {
        const src = source.getAttribute('src') || '';
        if (!/^https?:\/\//i.test(src) && !/^\/|^\.\.?\//.test(src)) {
          target.appendChild(document.createTextNode(source.getAttribute('alt') || ''));
          return;
        }
        const image = document.createElement('img');
        image.src = src;
        image.alt = source.getAttribute('alt') || '';
        image.loading = 'lazy';
        target.appendChild(image);
        return;
      }

      if (tag === 'a') {
        const href = source.getAttribute('href') || '';
        if (!isSafeUrl(href)) {
          source.childNodes.forEach((child) => appendNode(child, target));
          return;
        }
        const link = document.createElement('a');
        link.href = href;
        if (/^https?:\/\//i.test(href)) {
          link.target = '_blank';
          link.rel = 'noopener noreferrer';
        }
        source.childNodes.forEach((child) => appendNode(child, link));
        target.appendChild(link);
        return;
      }

      const element = document.createElement(tag);
      source.childNodes.forEach((child) => appendNode(child, element));
      target.appendChild(element);
    }

    parsed.body.childNodes.forEach((child) => appendNode(child, fragment));
    parent.appendChild(fragment);
  }

  function answerForQuestion(questionId) {
    const answerEdge = outgoingEdges(questionId, 'answers_with')[0];
    return answerEdge ? getNode(answerEdge.toNodeId) : null;
  }

  function questionForBlurb(blurbId) {
    const answerEdge = state.data.edges.find((edge) => (
      edge.toNodeId === blurbId && edge.kind === 'answers_with'
    ));
    return answerEdge ? getNode(answerEdge.fromNodeId) : null;
  }

  function makeButton(question, index) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'question-option';
    button.dataset.questionId = question._id;

    const label = document.createElement('span');
    label.className = 'option-letter';
    label.textContent = letterForIndex(index);
    button.appendChild(label);

    const text = document.createElement('span');
    text.textContent = question.text;
    button.appendChild(text);
    button.addEventListener('click', (event) => {
      if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) {
        return;
      }
      selectQuestion(question, button);
    });
    return button;
  }

  function letterForIndex(index) {
    return index < 26 ? String.fromCharCode(65 + index) : String(index + 1);
  }

  function renderQuestions(questions) {
    state.visibleQuestions = questions;
    optionsEl.replaceChildren();
    questions.forEach((question, index) => {
      optionsEl.appendChild(makeButton(question, index));
    });
  }

  function renderBlurb(blurb) {
    blurbEl.replaceChildren();
    if (blurb.html) {
      appendRichHtml(blurbEl, blurb.html);
      return;
    }

    for (const paragraph of blurb.paragraphs) {
      const p = document.createElement('p');
      blurbEl.appendChild(p);
      appendFormattedText(p, paragraph);
    }
  }

  function renderLastQuestion(question) {
    if (!question) {
      lastQuestionEl.replaceChildren();
      lastQuestionEl.hidden = true;
      return;
    }

    lastQuestionEl.textContent = question.text;
    lastQuestionEl.hidden = false;
  }

  function animateBlurbChange() {
    blurbEl.classList.remove('qa-updated');
    void blurbEl.offsetWidth;
    blurbEl.classList.add('qa-updated');
  }

  function syncBlurbScale() {
    blurbEl.classList.toggle('qa-condensed', state.blurbHistory.length > 0);
  }

  async function selectQuestion(question, button) {
    if (state.isTransitioning) {
      return;
    }

    const answer = answerForQuestion(question._id);
    if (!answer) {
      return;
    }

    state.isTransitioning = true;
    state.blurbHistory.push(state.currentBlurbId);
    button.classList.add('is-selected');
    await delay(170);
    await showQuestion(question);
    updateNavigationButtons();
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
    renderLastQuestion(question);
    renderBlurb(answer);
    animateBlurbChange();
    renderQuestions(visibleQuestionsForBlurb(answer._id));
  }

  function updateNavigationButtons() {
    const hasHistory = state.blurbHistory.length > 0;
    backButton.hidden = !hasHistory;
    backButton.classList.toggle('is-hidden', !hasHistory);
    resetButton.hidden = !hasHistory;
    resetButton.classList.toggle('is-hidden', !hasHistory);
    syncBlurbScale();
  }

  function renderBlurbForNavigation(blurb) {
    if (blurb._id === state.data.rootNodeId) {
      renderRootBlurb(blurb);
      return;
    }

    renderBlurb(blurb);
  }

  function animateBackButton() {
    backButton.classList.remove('is-keyboard-activated');
    void backButton.offsetWidth;
    backButton.classList.add('is-keyboard-activated');
    window.setTimeout(() => backButton.classList.remove('is-keyboard-activated'), 360);
  }

  function goBackOneStep({ animate = false } = {}) {
    if (state.isTransitioning || !state.blurbHistory.length) {
      return;
    }

    if (animate) {
      animateBackButton();
    }

    const previousBlurbId = state.blurbHistory.pop();
    const previousBlurb = getNode(previousBlurbId);
    if (!previousBlurb) {
      updateNavigationButtons();
      return;
    }

    state.activeQuestion = null;
    state.currentBlurbId = previousBlurb._id;
    renderLastQuestion(questionForBlurb(previousBlurb._id));
    renderBlurbForNavigation(previousBlurb);
    animateBlurbChange();
    renderQuestions(visibleQuestionsForBlurb(previousBlurb._id));
    updateNavigationButtons();
  }

  function resetQuestions() {
    state.activeQuestion = null;
    state.isTransitioning = false;
    state.blurbHistory = [];
    const root = getNode(state.data.rootNodeId);
    if (!root) {
      blurbEl.innerHTML = initialBlurb;
      optionsEl.textContent = 'Questions are unavailable right now.';
      return;
    }

    state.currentBlurbId = root._id;
    renderLastQuestion(null);
    renderRootBlurb(root);
    renderQuestions(visibleQuestionsForBlurb(root._id));
    updateNavigationButtons();
  }

  function renderRootBlurb(root) {
    blurbEl.replaceChildren();
    if (!root) {
      blurbEl.innerHTML = initialBlurb;
      return;
    }

    if (root.html) {
      appendRichHtml(blurbEl, root.html);
      return;
    }

    root.paragraphs.forEach((paragraph) => {
      const p = document.createElement('p');
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
        state.blurbHistory = [];
        renderLastQuestion(null);
        renderRootBlurb(root);
        renderQuestions(visibleQuestionsForBlurb(root._id));
        updateNavigationButtons();
        return;
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError || new Error('Q&A content is unavailable');
  }

  backButton.addEventListener('click', goBackOneStep);
  resetButton.addEventListener('click', resetQuestions);
  closeEmailDraft.addEventListener('click', hideEmailDraft);

  if (menuToggle && siteMenu) {
    menuToggle.addEventListener('click', () => setMenuOpen(siteMenu.hidden));
    siteMenu.addEventListener('click', (event) => {
      if (event.target.closest('a')) {
        setMenuOpen(false);
      }
    });
  }

  freeQuestionInput.addEventListener('input', autoresizeInput);
  freeQuestionInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      freeQuestionForm.requestSubmit();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && menuToggle && !siteMenu.hidden) {
      setMenuOpen(false);
      menuToggle.focus();
      return;
    }

    if (siteMenu && !siteMenu.hidden) {
      return;
    }

    const activeElement = document.activeElement;
    const isTyping = activeElement && ['INPUT', 'TEXTAREA'].includes(activeElement.tagName);
    const hasModifier = event.ctrlKey || event.metaKey || event.altKey || event.shiftKey;
    if (isTyping || state.isTransitioning || hasModifier) {
      return;
    }

    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      goBackOneStep({ animate: true });
      return;
    }

    if (event.key.length !== 1) {
      return;
    }

    const key = event.key.toLowerCase();
    if (!/^[a-z]$/.test(key)) {
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
