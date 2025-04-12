<script>
  // Fundraising University - JavaScript Part 2: Dashboard & Curriculum

function generateModuleCards() {
  const moduleGrid = document.querySelector('.fu-module-progress-grid');
  if (!moduleGrid) return;
  
  moduleGrid.innerHTML = '';
  
  Object.keys(APP.moduleData).forEach(moduleId => {
    const module = APP.moduleData[moduleId];
    const id = parseInt(moduleId);
    const progress = calculateModuleProgress(moduleId);
    const completed = APP.userData.completedModules.includes(id);
    const current = id === APP.userData.currentModule;
    const locked = id > APP.userData.currentModule && !completed;
    
    const card = document.createElement('div');
    card.className = `fu-module-card ${completed ? 'fu-module-completed' : ''} ${current ? 'fu-module-current' : ''}`;
    
    card.innerHTML = `
      <div class="fu-module-header">
        <h3>Module ${moduleId}: ${module.title}</h3>
        <div class="fu-module-status">
          ${completed ? '<span class="fu-status-badge fu-completed">Completed</span>' : 
            current ? '<span class="fu-status-badge fu-current">Current</span>' : 
            '<span class="fu-status-badge fu-locked">Locked</span>'}
        </div>
      </div>
      <p class="fu-module-description">${module.description}</p>
      <div class="fu-module-progress">
        <div class="fu-progress-bar">
          <div class="fu-progress-fill" style="width: ${progress}%"></div>
        </div>
        <div class="fu-progress-text">${progress}% Complete</div>
      </div>
      <div class="fu-module-stats">
        <div class="fu-module-stat">
          <div class="fu-stat-value">${APP.userData.completedChapters.filter(c => c.startsWith(`${moduleId}.`)).length}/${module.chapters.length}</div>
          <div class="fu-stat-label">Chapters Completed</div>
        </div>
        ${APP.userData.moduleScores[moduleId] ? `
        <div class="fu-module-stat">
          <div class="fu-stat-value">${APP.userData.moduleScores[moduleId]}%</div>
          <div class="fu-stat-label">Assessment Score</div>
        </div>
        ` : ''}
      </div>
      <div class="fu-module-actions">
        <button class="fu-btn fu-btn-primary" data-module="${moduleId}" ${locked ? 'disabled' : ''}>
          ${completed ? 'Review Module' : current ? 'Continue Learning' : 'View Module'}
        </button>
        ${current || completed ? `
        <button class="fu-btn fu-btn-secondary" data-assessment="${moduleId}">
          ${APP.userData.moduleScores[moduleId] ? 'Retake Assessment' : 'Take Assessment'}
        </button>
        ` : ''}
      </div>
    `;
    
    moduleGrid.appendChild(card);
    
    // Add event listeners
    const continueBtn = card.querySelector(`.fu-btn-primary[data-module="${moduleId}"]`);
    continueBtn.addEventListener('click', function() {
      if (!locked) {
        continueModule(moduleId);
      }
    });
    
    const assessmentBtn = card.querySelector(`.fu-btn-secondary[data-assessment="${moduleId}"]`);
    if (assessmentBtn) {
      assessmentBtn.addEventListener('click', function() {
        takeAssessment(moduleId);
      });
    }
  });
}

function generateActivityList() {
  const activityList = document.getElementById('activityList');
  if (!activityList) return;
  
  activityList.innerHTML = '';
  
  // Get most recent 5 activities
  const recentActivities = APP.userData.activity.slice(0, 5);
  
  recentActivities.forEach(activity => {
    const item = document.createElement('div');
    item.className = 'fu-activity-item';
    
    let icon, details;
    
    switch (activity.type) {
      case 'chapter_completed':
        icon = '<div class="fu-activity-icon fu-icon-chapter">📖</div>';
        details = `Completed Chapter: ${activity.title}`;
        break;
      case 'quiz_completed':
        icon = '<div class="fu-activity-icon fu-icon-quiz">📝</div>';
        details = `Completed Quiz: ${activity.title} - Score: ${activity.score}%`;
        break;
      case 'assessment_completed':
        icon = '<div class="fu-activity-icon fu-icon-assessment">🏆</div>';
        details = `Completed Assessment: ${activity.title} - Score: ${activity.score}% (${activity.passed ? 'Passed' : 'Failed'})`;
        break;
      case 'flashcards_session':
        icon = '<div class="fu-activity-icon fu-icon-flashcards">🔄</div>';
        details = `Studied ${activity.count} flashcards for ${activity.duration} minutes`;
        break;
      default:
        icon = '<div class="fu-activity-icon">🔹</div>';
        details = activity.title;
    }
    
    const date = new Date(activity.timestamp);
    const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    item.innerHTML = `
      ${icon}
      <div class="fu-activity-content">
        <div class="fu-activity-details">${details}</div>
        <div class="fu-activity-timestamp">${formattedDate}</div>
      </div>
    `;
    
    activityList.appendChild(item);
  });
}

function generateCertificationRequirements() {
  const requirementsContainer = document.getElementById('certificationRequirements');
  if (!requirementsContainer) return;
  
  requirementsContainer.innerHTML = '';
  
  // Module assessments
  for (let i = 1; i <= 6; i++) {
    const completed = APP.userData.completedModules.includes(i);
    const inProgress = i === APP.userData.currentModule;
    
    const requirementClass = completed ? 'fu-requirement-complete' : inProgress ? 'fu-requirement-in-progress' : '';
    const icon = completed ? '✓' : inProgress ? '→' : '○';
    
    const requirement = document.createElement('div');
    requirement.className = `fu-cert-requirement ${requirementClass}`;
    requirement.innerHTML = `
      <div class="fu-requirement-icon">${icon}</div>
      <div class="fu-requirement-text">Complete Module ${i} Assessment</div>
    `;
    
    requirementsContainer.appendChild(requirement);
  }
  
  // Final exam
  const finalExamCompleted = APP.userData.moduleScores && APP.userData.moduleScores.final;
  const finalExamRequirement = document.createElement('div');
  finalExamRequirement.className = `fu-cert-requirement ${finalExamCompleted ? 'fu-requirement-complete' : ''}`;
  finalExamRequirement.innerHTML = `
    <div class="fu-requirement-icon">${finalExamCompleted ? '✓' : '○'}</div>
    <div class="fu-requirement-text">Complete Final Comprehensive Exam</div>
  `;
  
  requirementsContainer.appendChild(finalExamRequirement);
}

function updateCertificationModal() {
  // Calculate certification progress
  const totalRequirements = 7; // 6 modules + final exam
  let completedRequirements = APP.userData.completedModules.length;
  
  if (APP.userData.moduleScores && APP.userData.moduleScores.final) {
    completedRequirements++;
  }
  
  const progress = Math.round((completedRequirements / totalRequirements) * 100);
  
  // Update progress bar
  document.getElementById('certProgressFill').style.width = `${progress}%`;
  document.getElementById('certProgressText').textContent = `${progress}%`;
  
  // Update checklist items
  const checklistItems = document.querySelectorAll('.fu-cert-checklist li');
  
  if (checklistItems.length > 0) {
    // Module assessments
    for (let i = 0; i < 6; i++) {
      if (APP.userData.completedModules.includes(i + 1)) {
        checklistItems[i].classList.add('completed');
      } else {
        checklistItems[i].classList.remove('completed');
      }
    }
    
    // Final exam
    if (APP.userData.moduleScores && APP.userData.moduleScores.final) {
      checklistItems[6].classList.add('completed');
    } else {
      checklistItems[6].classList.remove('completed');
    }
  }
}

function updateProfileModal() {
  // Fill profile form with user data
  document.getElementById('profileName').value = APP.userData.name;
  document.getElementById('profileEmail').value = APP.userData.email;
}

// -------------------------
// NAVIGATION AND PAGE FUNCTIONS
// -------------------------

function switchPage(pageId) {
  // Hide all pages
  document.querySelectorAll('.fu-page').forEach(page => {
    page.classList.remove('active');
  });
  
  // Show target page
  const targetPage = document.getElementById(pageId);
  if (targetPage) {
    targetPage.classList.add('active');
    APP.currentPage = pageId;
    
    // Initialize page-specific content
    if (pageId === 'curriculum-page') {
      initCurriculumPage();
    } else if (pageId === 'study-page') {
      hideStudySystems();
    } else if (pageId === 'assessments-page') {
      initAssessmentsPage();
    } else if (pageId === 'resources-page') {
      initResourcesPage();
    }
  }
}

function continueModule(moduleId) {
  // Switch to curriculum page
  switchPage('curriculum-page');
  
  // Select the module
  selectModule(moduleId);
}

function takeAssessment(moduleId) {
  // Switch to assessments page
  switchPage('assessments-page');
  
  // Start the assessment for the selected module
  startAssessment(moduleId);
}

// -------------------------
// CURRICULUM PAGE FUNCTIONS
// -------------------------

function initCurriculumPage() {
  // Generate module tabs
  generateModuleTabs();
  
  // Select current module
  selectModule(APP.userData.currentModule);
}

function generateModuleTabs() {
  const tabsContainer = document.getElementById('moduleTabs');
  if (!tabsContainer) return;
  
  tabsContainer.innerHTML = '';
  
  Object.keys(APP.moduleData).forEach(moduleId => {
    const module = APP.moduleData[moduleId];
    const id = parseInt(moduleId);
    const completed = APP.userData.completedModules.includes(id);
    const current = id === APP.userData.currentModule;
    const locked = id > APP.userData.currentModule && !completed;
    const progress = calculateModuleProgress(moduleId);
    
    const tab = document.createElement('div');
    tab.className = `fu-module-tab ${completed ? 'completed' : ''} ${current ? 'active' : ''} ${locked ? 'locked' : ''}`;
    tab.setAttribute('data-module', moduleId);
    
    tab.innerHTML = `
      <div class="fu-tab-title">Module ${moduleId}: ${module.title}</div>
      <div class="fu-tab-progress">${progress}% Complete</div>
    `;
    
    tab.addEventListener('click', function() {
      if (!locked) {
        selectModule(moduleId);
      }
    });
    
    tabsContainer.appendChild(tab);
  });
}

function selectModule(moduleId) {
  // Update active tab
  document.querySelectorAll('.fu-module-tab').forEach(tab => {
    tab.classList.remove('active');
  });
  
  const selectedTab = document.querySelector(`.fu-module-tab[data-module="${moduleId}"]`);
  if (selectedTab) {
    selectedTab.classList.add('active');
  }
  
  // Generate module content
  generateModuleContent(moduleId);
  
  // Update current module
  APP.currentModule = parseInt(moduleId);
}

function generateModuleContent(moduleId) {
  const contentContainer = document.getElementById('moduleContent');
  if (!contentContainer) return;
  
  const module = APP.moduleData[moduleId];
  if (!module) return;
  
  contentContainer.innerHTML = '';
  
  // Module header
  const header = document.createElement('h2');
  header.textContent = `Module ${moduleId}: ${module.title}`;
  contentContainer.appendChild(header);
  
  // Module overview
  const overview = document.createElement('div');
  overview.className = 'fu-module-overview';
  
  const progress = calculateModuleProgress(moduleId);
  const completedChapters = APP.userData.completedChapters.filter(c => c.startsWith(`${moduleId}.`)).length;
  const totalTime = module.chapters.reduce((total, chapter) => {
    return total + parseInt(chapter.length);
  }, 0);
  
  overview.innerHTML = `
    <div class="fu-overview-stats">
      <div class="fu-overview-stat">
        <div class="fu-overview-value">${progress}%</div>
        <div class="fu-overview-label">Completed</div>
      </div>
      <div class="fu-overview-stat">
        <div class="fu-overview-value">${completedChapters}/${module.chapters.length}</div>
        <div class="fu-overview-label">Chapters</div>
      </div>
      <div class="fu-overview-stat">
        <div class="fu-overview-value">${Math.round(totalTime / 60)} hrs</div>
        <div class="fu-overview-label">Total Time</div>
      </div>
      ${APP.userData.moduleScores[moduleId] ? `
      <div class="fu-overview-stat">
        <div class="fu-overview-value">${APP.userData.moduleScores[moduleId]}%</div>
        <div class="fu-overview-label">Assessment</div>
      </div>
      ` : ''}
    </div>
    
    <p>${module.description}</p>
    
    ${!APP.userData.completedModules.includes(parseInt(moduleId)) ? `
    <div class="fu-module-actions fu-mt-20">
      <button class="fu-btn fu-btn-primary" id="continueModuleBtn">Continue Learning</button>
      <button class="fu-btn fu-btn-secondary" id="moduleAssessmentBtn">
        ${APP.userData.moduleScores[moduleId] ? 'Retake Assessment' : 'Take Assessment'}
      </button>
    </div>
    ` : ''}
  `;
  
  contentContainer.appendChild(overview);
  
  // Chapter list
  const chapterList = document.createElement('div');
  chapterList.className = 'fu-chapter-list';
  
  const chapterHeader = document.createElement('h3');
  chapterHeader.textContent = 'Chapters';
  chapterHeader.className = 'fu-mb-20';
  chapterList.appendChild(chapterHeader);
  
  module.chapters.forEach(chapter => {
    const chapterCompleted = APP.userData.completedChapters.includes(chapter.id);
    
    const chapterItem = document.createElement('div');
    chapterItem.className = `fu-chapter-item ${chapterCompleted ? 'fu-chapter-completed' : ''}`;
    chapterItem.setAttribute('data-chapter', chapter.id);
    
    chapterItem.innerHTML = `
      <div class="fu-chapter-icon">${chapterCompleted ? '✓' : chapter.id.split('.')[1]}</div>
      <div class="fu-chapter-content">
        <div class="fu-chapter-title">${chapter.title}</div>
        <div class="fu-chapter-details">
          <span class="fu-chapter-length">${chapter.length}</span>
          <span class="fu-chapter-type">${chapter.type.charAt(0).toUpperCase() + chapter.type.slice(1)}</span>
        </div>
      </div>
    `;
    
    chapterItem.addEventListener('click', function() {
      openChapter(chapter);
    });
    
    chapterList.appendChild(chapterItem);
  });
  
  contentContainer.appendChild(chapterList);
  
  // Add event listeners for buttons
  const continueBtn = document.getElementById('continueModuleBtn');
  if (continueBtn) {
    continueBtn.addEventListener('click', function() {
      // Find the first incomplete chapter and open it
      const incompletedChapters = module.chapters.filter(chapter => 
        !APP.userData.completedChapters.includes(chapter.id)
      );
      
      if (incompletedChapters.length > 0) {
        openChapter(incompletedChapters[0]);
      } else {
        openChapter(module.chapters[0]); // Open first chapter if all are completed
      }
    });
  }
  
  const assessmentBtn = document.getElementById('moduleAssessmentBtn');
  if (assessmentBtn) {
    assessmentBtn.addEventListener('click', function() {
      takeAssessment(moduleId);
    });
  }
}

function openChapter(chapter) {
  // In a full implementation, this would open the chapter content
  // For this demo, we'll simulate completing the chapter
  if (!APP.userData.completedChapters.includes(chapter.id)) {
    APP.userData.completedChapters.push(chapter.id);
    
    // Add activity
    const moduleId = chapter.id.split('.')[0];
    APP.userData.activity.unshift({
      type: "chapter_completed",
      moduleId: parseInt(moduleId),
      chapterId: chapter.id,
      timestamp: new Date().toISOString(),
      title: chapter.title
    });
    
    // Save user data
    saveUserData();
    
    // Update UI
    const chapterItem = document.querySelector(`.fu-chapter-item[data-chapter="${chapter.id}"]`);
    if (chapterItem) {
      chapterItem.classList.add('fu-chapter-completed');
      chapterItem.querySelector('.fu-chapter-icon').textContent = '✓';
    }
    
    // Check if module is completed
    checkModuleCompletion(moduleId);
    
    // Show success message
    alert(`Chapter "${chapter.title}" completed! Your progress has been saved.`);
  } else {
    alert(`Reviewing chapter "${chapter.title}"`);
  }
}

function checkModuleCompletion(moduleId) {
  const module = APP.moduleData[moduleId];
  if (!module) return;
  
  const moduleChapters = module.chapters.map(chapter => chapter.id);
  const completedModuleChapters = APP.userData.completedChapters.filter(id => id.startsWith(`${moduleId}.`));
  
  if (moduleChapters.length === completedModuleChapters.length) {
    // All chapters completed
    if (!APP.userData.completedModules.includes(parseInt(moduleId))) {
      // Mark module as completed if not already
      APP.userData.completedModules.push(parseInt(moduleId));
      saveUserData();
      
      // Prompt user to take assessment
      if (!APP.userData.moduleScores[moduleId]) {
        if (confirm('Congratulations! You have completed all chapters in this module. Would you like to take the assessment now?')) {
          takeAssessment(moduleId);
        }
      }
    }
  }
}

// -------------------------
// STUDY SYSTEM FUNCTIONS
// -------------------------

function showStudySystem(systemId) {
  // Hide all study options
  document.querySelector('.fu-study-options').style.display = 'none';
  
  // Show selected system
  document.querySelector(`.fu-${systemId}`).style.display = 'block';
  
  // Set current study mode
  APP.currentStudyMode = systemId;
  
  // Initialize system if needed
  if (systemId === 'flashcard-system') {
    initFlashcardSystem();
  } else if (systemId === 'notes-system') {
    initNotesSystem();
  } else if (systemId === 'practice-system') {
    initPracticeSystem();
  }
}

function hideStudySystems() {
  // Show study options
  document.querySelector('.fu-study-options').style.display = 'grid';
  
  // Hide all systems
  document.querySelector('.fu-flashcard-system').style.display = 'none';
  document.querySelector('.fu-notes-system').style.display = 'none';
  document.querySelector('.fu-practice-system').style.display = 'none';
  
  // Reset current study mode
  APP.currentStudyMode = null;
}

// -------------------------
// FLASHCARD SYSTEM FUNCTIONS
// -------------------------

function initFlashcards() {
  const flashcardElement = document.getElementById('flashcard');
  const flipButton = document.getElementById('flip-card');
  const prevButton = document.getElementById('prev-card');
  const nextButton = document.getElementById('next-card');
  const ratingButtons = document.querySelectorAll('.fu-rating-btn');
  
  // Module selection
  const moduleSelect = document.getElementById('flashcardModule');
  
  if (moduleSelect) {
    moduleSelect.addEventListener('change', function() {
      const moduleId = parseInt(this.value);
      selectFlashcardModule(moduleId);
    });
  }
  
  // Card navigation
  if (flashcardElement) {
    flashcardElement.addEventListener('click', flipCard);
  }
  
  if (flipButton) {
    flipButton.addEventListener('click', function(e) {
      e.stopPropagation();
      flipCard();
    });
  }
  
  if (prevButton) {
    prevButton.addEventListener('click', function(e) {
      e.stopPropagation();
      previousCard();
    });
  }
  
  if (nextButton) {
    nextButton.addEventListener('click', function(e) {
      e.stopPropagation();
      nextCard();
    });
  }
  
  // Rating buttons
  if (ratingButtons) {
    ratingButtons.forEach(button => {
      button.addEventListener('click', function(e) {
        e.stopPropagation();
        rateCard(parseInt(this.dataset.rating));
      });
    });
  }
}

function initFlashcardSystem() {
  // Populate module select
  const moduleSelect = document.getElementById('flashcardModule');
  if (moduleSelect) {
    moduleSelect.innerHTML = '';
    
    Object.keys(APP.moduleData).forEach(moduleId => {
      if (moduleId <= APP.userData.currentModule) {
        const module = APP.moduleData[moduleId];
        const option = document.createElement('option');
        option.value = moduleId;
        option.textContent = `Module ${moduleId}: ${module.title}`;
        moduleSelect.appendChild(option);
      }
    });
    
    // Select current module by default
    moduleSelect.value = APP.userData.currentModule;
    
    // Initialize flashcard data for selected module
    selectFlashcardModule(APP.userData.currentModule);
  }
  
  // Reset flashcard session
  APP.flashcardSession = {
    moduleId: APP.userData.currentModule,
    currentIndex: 0,
    isFlipped: false,
    ratings: [],
    startTime: new Date()
  };
  
  // Reset stats
  document.getElementById('cardsStudied').textContent = '0';
  document.getElementById('averageRating').textContent = '0';
  document.getElementById('timeSpent').textContent = '0:00';
  
  // Start timer
  startFlashcardTimer();
}

function selectFlashcardModule(moduleId) {
  // Update flashcard session
  APP.flashcardSession.moduleId = moduleId;
  APP.flashcardSession.currentIndex = 0;
  APP.flashcardSession.isFlipped = false;
  APP.flashcardSession.ratings = [];
  
  // Update flashcard title
  document.getElementById('flashcardTitle').textContent = `Module ${moduleId}: ${APP.moduleData[moduleId].title}`;
  
  // Update card count
  document.getElementById('totalCards').textContent = APP.flashcardData[moduleId].length;
  
  // Load first card
  loadCard(0);
}

function loadCard(index) {
  const moduleId = APP.flashcardSession.moduleId;
  const cards = APP.flashcardData[moduleId];
  
  if (index >= 0 && index < cards.length) {
    const card = cards[index];
    
    document.getElementById('card-question').textContent = card.question;
    document.getElementById('card-answer').textContent = card.answer;
    document.getElementById('card-explanation').textContent = card.explanation;
    document.getElementById('currentCardNum').textContent = index + 1;
    
    // Reset card flip state
    APP.flashcardSession.isFlipped = false;
    document.getElementById('flashcard').classList.remove('flipped');
    
    // Update current index
    APP.flashcardSession.currentIndex = index;
  }
}

function flipCard() {
  APP.flashcardSession.isFlipped = !APP.flashcardSession.isFlipped;
  
  if (APP.flashcardSession.isFlipped) {
    document.getElementById('flashcard').classList.add('flipped');
  } else {
    document.getElementById('flashcard').classList.remove('flipped');
  }
}

function previousCard() {
  if (APP.flashcardSession.currentIndex > 0) {
    loadCard(APP.flashcardSession.currentIndex - 1);
  }
}

function nextCard() {
  const moduleId = APP.flashcardSession.moduleId;
  const cards = APP.flashcardData[moduleId];
  
  if (APP.flashcardSession.currentIndex < cards.length - 1) {
    loadCard(APP.flashcardSession.currentIndex + 1);
  }
}

function rateCard(rating) {
  // Add rating to session
  APP.flashcardSession.ratings.push(rating);
  
  // Update stats
  document.getElementById('cardsStudied').textContent = APP.flashcardSession.ratings.length;
  
  const avgRating = APP.flashcardSession.ratings.reduce((sum, r) => sum + r, 0) / APP.flashcardSession.ratings.length;
  document.getElementById('averageRating').textContent = avgRating.toFixed(1);
  
  // Automatically advance to next card if available
  nextCard();
  
  // If end of deck is reached, show summary
  const moduleId = APP.flashcardSession.moduleId;
  const cards = APP.flashcardData[moduleId];
  
  if (APP.flashcardSession.currentIndex === cards.length - 1) {
    // End session after a short delay
    setTimeout(function() {
      endFlashcardSession();
    }, 500);
  }
}

function startFlashcardTimer() {
  const timerInterval = setInterval(function() {
    if (APP.currentStudyMode === 'flashcard-system') {
      const now = new Date();
      const sessionDuration = Math.floor((now - APP.flashcardSession.startTime) / 1000); // in seconds
      
      const minutes = Math.floor(sessionDuration / 60);
      const seconds = sessionDuration % 60;
      
      document.getElementById('timeSpent').textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    } else {
      clearInterval(timerInterval);
    }
  }, 1000);
}

function endFlashcardSession() {
  // Calculate session stats
  const sessionDuration = Math.floor((new Date() - APP.flashcardSession.startTime) / 1000 / 60); // in minutes
  const cardsStudied = APP.flashcardSession.ratings.length;
  
  // Add activity
  APP.userData.activity.unshift({
    type: "flashcards_session",
    count: cardsStudied,
    duration: sessionDuration,
    timestamp: new Date().toISOString(),
    title: "Spaced Repetition Practice"
  });
  
  // Save user data
  saveUserData();
  
  // Show summary
  if (cardsStudied > 0) {
    alert(`Flashcard session complete!\n\nYou studied ${cardsStudied} cards in ${sessionDuration} minutes.\nAverage rating: ${(APP.flashcardSession.ratings.reduce((sum, r) => sum + r, 0) / cardsStudied).toFixed(1)}/5`);
  }
}

// -------------------------
// NOTES SYSTEM FUNCTIONS
// -------------------------

function initNotes() {
  // Module selection
  const moduleSelect = document.getElementById('notesModule');
  
  if (moduleSelect) {
    moduleSelect.addEventListener('change', function() {
      const moduleId = parseInt(this.value);
      loadNotes(moduleId);
    });
  }
  
  // Save button
  const saveButton = document.getElementById('saveNotes');
  if (saveButton) {
    saveButton.addEventListener('click', saveNotes);
  }
  
  // Reset button
  const resetButton = document.getElementById('resetNotes');
  if (resetButton) {
    resetButton.addEventListener('click', function() {
      if (confirm('Are you sure you want to reset your notes? This action cannot be undone.')) {
        const moduleId = document.getElementById('notesModule').value;
        loadNotes(moduleId, true);
      }
    });
  }
}

function initNotesSystem() {
  // Populate module select
  const moduleSelect = document.getElementById('notesModule');
  if (moduleSelect) {
    moduleSelect.innerHTML = '';
    
    Object.keys(APP.moduleData).forEach(moduleId => {
      if (moduleId <= APP.userData.currentModule) {
        const module = APP.moduleData[moduleId];
        const option = document.createElement('option');
        option.value = moduleId;
        option.textContent = `Module ${moduleId}: ${module.title}`;
        moduleSelect.appendChild(option);
      }
    });
    
    // Select current module by default
    moduleSelect.value = APP.userData.currentModule;
    
    // Load notes for selected module
    loadNotes(APP.userData.currentModule);
  }
}

function loadNotes(moduleId, reset = false) {
  // Update notes title
  document.getElementById('notesTitle').textContent = `Module ${moduleId}: ${APP.moduleData[moduleId].title}`;
  
  // Load saved notes or empty string if reset or no notes exist
  const notesContent = document.getElementById('notesContent');
  
  if (reset) {
    notesContent.value = '';
  } else {
    notesContent.value = APP.userData.moduleNotes[moduleId] || '';
  }
}

function saveNotes() {
  const moduleId = document.getElementById('notesModule').value;
  const notesContent = document.getElementById('notesContent').value;
  
  // Initialize moduleNotes object if it doesn't exist
  if (!APP.userData.moduleNotes) {
    APP.userData.moduleNotes = {};
  }
  
  // Save notes for the module
  APP.userData.moduleNotes[moduleId] = notesContent;
  
  // Save user data
  saveUserData();
  
  // Show confirmation
  alert('Notes saved successfully!');
}

// -------------------------
// PRACTICE SYSTEM FUNCTIONS
// -------------------------

function initPractice() {
  // Module selection
  const moduleSelect = document.getElementById('practiceModule');
  
  if (moduleSelect) {
    moduleSelect.addEventListener('change', function() {
      // Module selection change logic here
    });
  }
  
  // Start practice button
  const startButton = document.getElementById('startPractice');
  if (startButton) {
    startButton.addEventListener('click', startPracticeQuestions);
  }
  
  // Next question button
  const nextButton = document.getElementById('nextPracticeQuestion');
  if (nextButton) {
    nextButton.addEventListener('click', nextPracticeQuestion);
  }
  
  // Try another button
  const tryAnotherButton = document.getElementById('tryAnotherPractice');
  if (tryAnotherButton) {
    tryAnotherButton.addEventListener('click', function() {
      document.getElementById('practiceContainer').style.display = 'none';
      document.getElementById('practiceResults').style.display = 'none';
      document.querySelector('.fu-module-selector').style.display = 'block';
    });
  }
}

function initPracticeSystem() {
  // Populate module select
  const moduleSelect = document.getElementById('practiceModule');
  if (moduleSelect) {
    moduleSelect.innerHTML = '';
    
    Object.keys(APP.moduleData).forEach(moduleId => {
      if (moduleId <= APP.userData.currentModule) {
        const module = APP.moduleData[moduleId];
        const option = document.createElement('option');
        option.value = moduleId;
        option.textContent = `Module ${moduleId}: ${module.title}`;
        moduleSelect.appendChild(option);
      }
    });
    
    // Select current module by default
    moduleSelect.value = APP.userData.currentModule;
  }
  
  // Reset practice container
  document.getElementById('practiceContainer').style.display = 'none';
  document.querySelector('.fu-module-selector').style.display = 'block';
}

function startPracticeQuestions() {
  const moduleId = document.getElementById('practiceModule').value;
  
  // Get quiz questions for the module
  const quizData = APP.quizData[moduleId];
  
  if (!quizData || !quizData.questions || quizData.questions.length === 0) {
    alert('No practice questions available for this module.');
    return;
  }
  
  // Select 5 random questions
  const practiceQuestions = getRandomQuestions(quizData.questions, 5);
  
  // Store in session
  APP.practiceSession = {
    moduleId: moduleId,
    questions: practiceQuestions,
    currentIndex: 0,
    answers: [],
    score: 0
  };
  
  // Hide module selector and show practice container
  document.querySelector('.fu-module-selector').style.display = 'none';
  document.getElementById('practiceContainer').style.display = 'block';
  document.getElementById('practiceResults').style.display = 'none';
  document.getElementById('practiceFeedback').style.display = 'none';
  
  // Load first question
  loadPracticeQuestion(0);
}

function getRandomQuestions(questions, count) {
  const shuffled = [...questions].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

function loadPracticeQuestion(index) {
  const session = APP.practiceSession;
  
  if (index >= 0 && index < session.questions.length) {
    const question = session.questions[index];
    
    // Update question title
    document.getElementById('practiceQuestionTitle').textContent = `Question ${index + 1} of ${session.questions.length}`;
    
    // Update question text
    document.getElementById('practiceQuestionText').textContent = question.text;
    
    // Generate options
    const optionsList = document.getElementById('practiceOptionsList');
    optionsList.innerHTML = '';
    
    question.options.forEach((option, optionIndex) => {
      const optionElement = document.createElement('div');
      optionElement.className = 'fu-option';
      optionElement.dataset.index = optionIndex;
      optionElement.textContent = option;
      
      optionElement.addEventListener('click', function() {
        // Select this option
        document.querySelectorAll('#practiceOptionsList .fu-option').forEach(opt => {
          opt.classList.remove('selected');
        });
        
        this.classList.add('selected');
        
        // Show feedback
        checkPracticeAnswer(parseInt(this.dataset.index));
      });
      
      optionsList.appendChild(optionElement);
    });
    
    // Update current index
    APP.practiceSession.currentIndex = index;
  } else {
    // End of practice questions
    showPracticeResults();
  }
}

function checkPracticeAnswer(selectedIndex) {
  const session = APP.practiceSession;
  const question = session.questions[session.currentIndex];
  
  // Store answer
  session.answers.push(selectedIndex);
  
  // Check if correct
  const isCorrect = selectedIndex === question.correctAnswer;
  
  if (isCorrect) {
    session.score++;
  }
  
  // Show feedback
  const feedbackElement = document.getElementById('practiceFeedback');
  const feedbackContent = document.getElementById('feedbackContent');
  
  feedbackContent.className = isCorrect ? 'fu-feedback-correct' : 'fu-feedback-incorrect';
  
  if (isCorrect) {
    feedbackContent.innerHTML = `
      <h4>Correct!</h4>
      <p>${question.options[question.correctAnswer]}</p>
    `;
  } else {
    feedbackContent.innerHTML = `
      <h4>Incorrect</h4>
      <p>You selected: ${question.options[selectedIndex]}</p>
      <p>Correct answer: ${question.options[question.correctAnswer]}</p>
    `;
  }
  
  feedbackElement.style.display = 'block';
}

function nextPracticeQuestion() {
  document.getElementById('practiceFeedback').style.display = 'none';
  loadPracticeQuestion(APP.practiceSession.currentIndex + 1);
}

function showPracticeResults() {
  const session = APP.practiceSession;
  
  // Calculate score percentage
  const scorePercentage = Math.round((session.score / session.questions.length) * 100);
  
  // Update results display
  document.getElementById('practiceScoreDisplay').textContent = `${scorePercentage}%`;
  document.getElementById('practiceCorrectDisplay').textContent = `${session.score}/${session.questions.length}`;
  
  // Hide question container and show results
  document.querySelector('.fu-practice-question').style.display = 'none';
  document.getElementById('practiceFeedback').style.display = 'none';
  document.getElementById('practiceResults').style.display = 'block';
}

// Fundraising University - JavaScript Part 3: Assessments & Resources

// -------------------------
// ASSESSMENT FUNCTIONS
// -------------------------

function initAssessmentsPage() {
  // Generate assessment cards
  generateAssessmentCards();
  
  // Show assessment list and hide quiz system
  document.querySelector('.fu-assessments-list').style.display = 'grid';
  document.querySelector('.fu-quiz-system').style.display = 'none';
}

function generateAssessmentCards() {
  const assessmentsList = document.querySelector('.fu-assessments-list');
  if (!assessmentsList) return;
  
  assessmentsList.innerHTML = '';
  
  // Create assessment cards for modules up to current module
  for (let i = 1; i <= Math.max(6, APP.userData.currentModule); i++) {
    if (i > 6) break; // Only 6 modules in our data
    
    const quizData = APP.quizData[i];
    const moduleData = APP.moduleData[i];
    
    if (!quizData || !moduleData) continue;
    
    const hasScore = APP.userData.moduleScores && APP.userData.moduleScores[i];
    const isAvailable = i <= APP.userData.currentModule;
    
    const card = document.createElement('div');
    card.className = 'fu-assessment-card';
    
    card.innerHTML = `
      <div class="fu-assessment-header">
        <h3>${quizData.title}</h3>
        <div class="fu-assessment-details">
          <span class="fu-assessment-time">${quizData.timeLimit} min</span>
          <span class="fu-assessment-questions">${quizData.questions.length} questions</span>
          <span class="fu-assessment-status">${hasScore ? 'Completed' : isAvailable ? 'Available' : 'Locked'}</span>
        </div>
      </div>
      
      <p class="fu-assessment-description">${quizData.description}</p>
      
      ${hasScore ? `
      <div class="fu-assessment-scores">
        <span>Your Score: <strong>${APP.userData.moduleScores[i]}%</strong></span>
        <span>Passing Score: <strong>${quizData.passingScore}%</strong></span>
      </div>
      ` : ''}
      
      <div class="fu-assessment-actions">
        <button class="fu-btn fu-btn-primary" data-assessment="${i}" ${!isAvailable ? 'disabled' : ''}>
          ${hasScore ? 'Retake Assessment' : 'Start Assessment'}
        </button>
      </div>
    `;
    
    assessmentsList.appendChild(card);
    
    // Add event listener for button
    const startButton = card.querySelector('.fu-btn-primary');
    if (startButton && isAvailable) {
      startButton.addEventListener('click', function() {
        startAssessment(i);
      });
    }
  }
  
  // Add final comprehensive exam card if at least one module is completed
  if (APP.userData.completedModules.length > 0) {
    const finalExamData = APP.quizData.final;
    const hasScore = APP.userData.moduleScores && APP.userData.moduleScores.final;
    const isAvailable = APP.userData.completedModules.length >= 6; // All modules must be completed
    
    const card = document.createElement('div');
    card.className = 'fu-assessment-card';
    
    card.innerHTML = `
      <div class="fu-assessment-header">
        <h3>${finalExamData.title}</h3>
        <div class="fu-assessment-details">
          <span class="fu-assessment-time">${finalExamData.timeLimit} min</span>
          <span class="fu-assessment-questions">${finalExamData.questions.length || 'Multiple'} questions</span>
          <span class="fu-assessment-status">${hasScore ? 'Completed' : isAvailable ? 'Available' : 'Locked'}</span>
        </div>
      </div>
      
      <p class="fu-assessment-description">${finalExamData.description}</p>
      
      ${hasScore ? `
      <div class="fu-assessment-scores">
        <span>Your Score: <strong>${APP.userData.moduleScores.final}%</strong></span>
        <span>Passing Score: <strong>${finalExamData.passingScore}%</strong></span>
      </div>
      ` : ''}
      
      <div class="fu-assessment-actions">
        <button class="fu-btn fu-btn-primary" data-assessment="final" ${!isAvailable ? 'disabled' : ''}>
          ${hasScore ? 'Retake Final Exam' : 'Start Final Exam'}
        </button>
      </div>
    `;
    
    assessmentsList.appendChild(card);
    
    // Add event listener for button
    const startButton = card.querySelector('.fu-btn-primary');
    if (startButton && isAvailable) {
      startButton.addEventListener('click', function() {
        startAssessment('final');
      });
    }
  }
}

function initQuiz() {
  const questionTextElement = document.getElementById('questionText');
  const optionsListElement = document.getElementById('optionsList');
  const currentQuestionNumElement = document.getElementById('currentQuestionNum');
  const totalQuestionsElement = document.getElementById('totalQuestions');
  const progressFillElement = document.getElementById('progressFill');
  const timerDisplayElement = document.getElementById('timerDisplay');
  const prevQuestionButton = document.getElementById('prevQuestion');
  const nextQuestionButton = document.getElementById('nextQuestion');
  const submitQuizButton = document.getElementById('submitQuiz');
  
  // Navigation buttons
  if (prevQuestionButton) {
    prevQuestionButton.addEventListener('click', previousQuestion);
  }
  
  if (nextQuestionButton) {
    nextQuestionButton.addEventListener('click', nextQuestion);
  }
  
  if (submitQuizButton) {
    submitQuizButton.addEventListener('click', submitQuiz);
  }
  
  // Results actions
  document.getElementById('reviewQuiz').addEventListener('click', reviewQuiz);
  document.getElementById('continueBtn').addEventListener('click', continueAfterQuiz);
  document.getElementById('retakeBtn').addEventListener('click', retakeQuiz);
}

function startAssessment(moduleId) {
  // Get quiz data
  const quizData = APP.quizData[moduleId];
  if (!quizData) return;
  
  // Hide assessment list and show quiz system
  document.querySelector('.fu-assessments-list').style.display = 'none';
  document.querySelector('.fu-quiz-system').style.display = 'block';
  document.getElementById('quizResults').style.display = 'none';
  document.getElementById('questionContainer').style.display = 'block';
  document.querySelector('.fu-quiz-controls').style.display = 'flex';
  
  // Update quiz title
  document.getElementById('quizTitle').textContent = quizData.title;
  
  // Initialize quiz state
  APP.currentQuiz = quizData;
  APP.quizState = {
    currentQuestionIndex: 0,
    userAnswers: new Array(quizData.questions.length).fill(null),
    timeRemaining: quizData.timeLimit * 60, // Convert to seconds
    timerInterval: null,
    quizSubmitted: false
  };
  
  // Update total questions
  document.getElementById('totalQuestions').textContent = quizData.questions.length;
  
  // Load first question
  loadQuestion(0);
  
  // Start timer
  updateTimerDisplay();
  startTimer();
}

function loadQuestion(index) {
  const quizData = APP.currentQuiz;
  const questions = quizData.questions;
  
  if (index >= 0 && index < questions.length) {
    const question = questions[index];
    
    // Update question text
    document.getElementById('questionText').textContent = question.text;
    
    // Generate options
    const optionsList = document.getElementById('optionsList');
    optionsList.innerHTML = '';
    
    question.options.forEach((option, optionIndex) => {
      const optionElement = document.createElement('div');
      optionElement.className = 'fu-option';
      
      if (APP.quizState.userAnswers[index] === optionIndex) {
        optionElement.classList.add('selected');
      }
      
      optionElement.innerHTML = `
        <input type="radio" id="option${optionIndex}" name="question${index}" value="${optionIndex}" 
          ${APP.quizState.userAnswers[index] === optionIndex ? 'checked' : ''}>
        <label for="option${optionIndex}">${option}</label>
      `;
      
      optionElement.addEventListener('click', function() {
        selectOption(index, optionIndex);
      });
      
      optionsList.appendChild(optionElement);
    });
    
    // Update navigation
    document.getElementById('currentQuestionNum').textContent = index + 1;
    document.getElementById('progressFill').style.width = `${((index + 1) / questions.length) * 100}%`;
    
    // Update quiz state
    APP.quizState.currentQuestionIndex = index;
    
    // Update navigation buttons
    updateNavigationButtons();
  }
}

function selectOption(questionIndex, optionIndex) {
  // Update user answers
  APP.quizState.userAnswers[questionIndex] = optionIndex;
  
  // Update UI
  const optionElements = document.querySelectorAll('#optionsList .fu-option');
  optionElements.forEach((element, index) => {
    if (index === optionIndex) {
      element.classList.add('selected');
    } else {
      element.classList.remove('selected');
    }
  });
}

function previousQuestion() {
  if (APP.quizState.currentQuestionIndex > 0) {
    loadQuestion(APP.quizState.currentQuestionIndex - 1);
  }
}

function nextQuestion() {
  if (APP.quizState.currentQuestionIndex < APP.currentQuiz.questions.length - 1) {
    loadQuestion(APP.quizState.currentQuestionIndex + 1);
  }
}

function updateNavigationButtons() {
  const prevButton = document.getElementById('prevQuestion');
  const nextButton = document.getElementById('nextQuestion');
  const submitButton = document.getElementById('submitQuiz');
  
  if (prevButton) {
    prevButton.style.display = APP.quizState.currentQuestionIndex === 0 ? 'none' : 'block';
  }
  
  if (nextButton) {
    nextButton.style.display = APP.quizState.currentQuestionIndex === APP.currentQuiz.questions.length - 1 ? 'none' : 'block';
  }
  
  if (submitButton) {
    submitButton.style.display = APP.quizState.currentQuestionIndex === APP.currentQuiz.questions.length - 1 ? 'block' : 'none';
  }
}

function startTimer() {
  APP.quizState.timerInterval = setInterval(function() {
    APP.quizState.timeRemaining--;
    updateTimerDisplay();
    
    if (APP.quizState.timeRemaining <= 0) {
      clearInterval(APP.quizState.timerInterval);
      submitQuiz();
    }
  }, 1000);
}

function updateTimerDisplay() {
  const minutes = Math.floor(APP.quizState.timeRemaining / 60);
  const seconds = APP.quizState.timeRemaining % 60;
  
  document.getElementById('timerDisplay').textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  
  if (APP.quizState.timeRemaining < 300) { // 5 minutes left
    document.getElementById('timerDisplay').classList.add('fu-timer-warning');
  }
}

function submitQuiz() {
  if (APP.quizState.quizSubmitted) return;
  
  // Stop timer
  clearInterval(APP.quizState.timerInterval);
  
  // Mark as submitted
  APP.quizState.quizSubmitted = true;
  
  // Calculate results
  const results = calculateQuizResults();
  
  // Display results
  displayQuizResults(results);
  
  // Update user data
  saveQuizResults(results);
}

function calculateQuizResults() {
  const quizData = APP.currentQuiz;
  const userAnswers = APP.quizState.userAnswers;
  let correctCount = 0;
  const detailedResults = [];
  
  quizData.questions.forEach((question, index) => {
    const userAnswer = userAnswers[index];
    const isCorrect = userAnswer === question.correctAnswer;
    
    if (isCorrect) {
      correctCount++;
    }
    
    detailedResults.push({
      questionId: question.id,
      questionText: question.text,
      userAnswer: userAnswer,
      correctAnswer: question.correctAnswer,
      isCorrect: isCorrect
    });
  });
  
  const score = Math.round((correctCount / quizData.questions.length) * 100);
  const passed = score >= quizData.passingScore;
  
  return {
    moduleId: quizData.moduleId,
    title: quizData.title,
    score: score,
    correctAnswers: correctCount,
    totalQuestions: quizData.questions.length,
    passed: passed,
    detailedResults: detailedResults
  };
}

function displayQuizResults(results) {
  // Hide question container and controls
  document.getElementById('questionContainer').style.display = 'none';
  document.querySelector('.fu-quiz-controls').style.display = 'none';
  
  // Show results
  const resultsElement = document.getElementById('quizResults');
  resultsElement.style.display = 'block';
  
  // Update summary
  document.getElementById('scoreDisplay').textContent = `${results.score}%`;
  document.getElementById('correctAnswersDisplay').textContent = `${results.correctAnswers}/${results.totalQuestions}`;
  
  const passStatus = document.getElementById('passStatus');
  if (results.passed) {
    passStatus.textContent = 'PASSED';
    passStatus.className = 'fu-result-status fu-pass';
  } else {
    passStatus.textContent = 'NOT PASSED';
    passStatus.className = 'fu-result-status fu-fail';
  }
  
  // Generate detailed results
  const detailedResultsContainer = document.getElementById('detailedResults');
  detailedResultsContainer.innerHTML = '';
  
  results.detailedResults.forEach((result, index) => {
    const resultItem = document.createElement('div');
    resultItem.className = `fu-result-item ${result.isCorrect ? 'fu-correct' : 'fu-incorrect'}`;
    
    resultItem.innerHTML = `
      <div class="fu-result-question">
        <span class="fu-question-number">${index + 1}.</span>
        <span class="fu-question-text">${result.questionText}</span>
      </div>
      <div class="fu-result-answers">
        <div class="fu-your-answer">
          Your answer: ${result.userAnswer !== null ? APP.currentQuiz.questions[index].options[result.userAnswer] : 'Not answered'}
        </div>
        <div class="fu-correct-answer">
          Correct answer: ${APP.currentQuiz.questions[index].options[result.correctAnswer]}
        </div>
      </div>
    `;
    
    detailedResultsContainer.appendChild(resultItem);
  });
  
  // Generate recommendations
  const recommendationsList = document.getElementById('recommendationsList');
  recommendationsList.innerHTML = '';
  
  // Group incorrect answers by first part of question ID (e.g., "q1" from "q1.3")
  const topicRecommendations = {};
  
  results.detailedResults.forEach(result => {
    if (!result.isCorrect) {
      const topic = result.questionId.split('.')[0];
      if (!topicRecommendations[topic]) {
        topicRecommendations[topic] = 1;
      } else {
        topicRecommendations[topic]++;
      }
    }
  });
  
  // Create recommendation items
  Object.keys(topicRecommendations).forEach(topic => {
    const recommendation = document.createElement('li');
    recommendation.textContent = `Review ${topic.replace('q', 'Topic ')} (${topicRecommendations[topic]} incorrect answers)`;
    recommendationsList.appendChild(recommendation);
  });
  
  // Show/hide continue button based on pass status
  document.getElementById('continueBtn').style.display = results.passed ? 'block' : 'none';
}

function saveQuizResults(results) {
  // Initialize moduleScores if needed
  if (!APP.userData.moduleScores) {
    APP.userData.moduleScores = {};
  }
  
  // Save score
  APP.userData.moduleScores[results.moduleId] = results.score;
  
  // If passed and not already completed, add to completed modules
  if (results.passed && !APP.userData.completedModules.includes(parseInt(results.moduleId))) {
    // Only add to completed modules if it's a numbered module (not final exam)
    if (results.moduleId !== 'final') {
      APP.userData.completedModules.push(parseInt(results.moduleId));
    }
  }
  
  // Add activity
  APP.userData.activity.unshift({
    type: "assessment_completed",
    moduleId: results.moduleId,
    score: results.score,
    passed: results.passed,
    timestamp: new Date().toISOString(),
    title: results.title
  });
  
  // Save user data
  saveUserData();
  
  // Update dashboard if visible
  if (document.getElementById('dashboard-page').classList.contains('active')) {
    updateDashboard();
  }
}

function reviewQuiz() {
  // Hide results and show questions
  document.getElementById('quizResults').style.display = 'none';
  document.getElementById('questionContainer').style.display = 'block';
  document.querySelector('.fu-quiz-controls').style.display = 'flex';
  
  // Load first question
  loadQuestion(0);
}

function continueAfterQuiz() {
  // Get current module ID
  const moduleId = APP.currentQuiz.moduleId;
  
  // Close quiz
  document.querySelector('.fu-quiz-system').style.display = 'none';
  
  // If it's a module (not final exam) and it's the current module,
  // advance to next module if available
  if (moduleId !== 'final' && parseInt(moduleId) === APP.userData.currentModule) {
    const nextModuleId = parseInt(moduleId) + 1;
    
    if (nextModuleId <= 6 && APP.moduleData[nextModuleId]) {
      APP.userData.currentModule = nextModuleId;
      saveUserData();
      
      // Show confirmation
      alert(`Congratulations on completing Module ${moduleId}! You have been advanced to Module ${nextModuleId}.`);
    }
  }
  
  // Go to dashboard
  switchPage('dashboard-page');
}

function retakeQuiz() {
  // Get current module ID
  const moduleId = APP.currentQuiz.moduleId;
  
  // Reset quiz and start again
  startAssessment(moduleId);
}

// -------------------------
// RESOURCES PAGE FUNCTIONS
// -------------------------

function initResourcesPage() {
  // Populate library items
  generateLibraryItems();
  
  // Populate video items
  generateVideoItems();
  
  // Populate template items
  generateTemplateItems();
  
  // Populate community content
  generateCommunityContent();
}

function showResourceContent(contentId) {
  // Hide resource grid
  document.querySelector('.fu-resources-grid').style.display = 'none';
  
  // Hide all resource contents
  document.querySelectorAll('.fu-resource-content').forEach(content => {
    content.style.display = 'none';
  });
  
  // Show selected content
  document.getElementById(contentId).style.display = 'block';
}

function hideResourceContents() {
  // Show resource grid
  document.querySelector('.fu-resources-grid').style.display = 'grid';
  
  // Hide all resource contents
  document.querySelectorAll('.fu-resource-content').forEach(content => {
    content.style.display = 'none';
  });
}

function generateLibraryItems() {
  const libraryContainer = document.querySelector('.fu-library-items');
  if (!libraryContainer) return;
  
  libraryContainer.innerHTML = '';
  
  APP.resourceData.library.forEach(item => {
    const libraryItem = document.createElement('div');
    libraryItem.className = 'fu-library-item';
    
    libraryItem.innerHTML = `
      <div class="fu-resource-title">${item.title}</div>
      <div class="fu-resource-description">${item.description}</div>
      <div class="fu-resource-meta">
        <span>${item.author}</span>
        <span>${item.type} (${item.year})</span>
      </div>
    `;
    
    libraryContainer.appendChild(libraryItem);
  });
}

function generateVideoItems() {
  const videosContainer = document.querySelector('.fu-videos-grid');
  if (!videosContainer) return;
  
  videosContainer.innerHTML = '';
  
  APP.resourceData.videos.forEach(item => {
    const videoItem = document.createElement('div');
    videoItem.className = 'fu-video-item';
    
    videoItem.innerHTML = `
      <div class="fu-resource-title">${item.title}</div>
      <div class="fu-resource-description">${item.description}</div>
      <div class="fu-resource-meta">
        <span>${item.presenter}</span>
        <span>${item.duration} (${item.year})</span>
      </div>
    `;
    
    videosContainer.appendChild(videoItem);
  });
}

function generateTemplateItems() {
  const templatesContainer = document.querySelector('.fu-templates-grid');
  if (!templatesContainer) return;
  
  templatesContainer.innerHTML = '';
  
  APP.resourceData.templates.forEach(item => {
    const templateItem = document.createElement('div');
    templateItem.className = 'fu-template-item';
    
    templateItem.innerHTML = `
      <div class="fu-resource-title">${item.title}</div>
      <div class="fu-resource-description">${item.description}</div>
      <div class="fu-resource-meta">
        <span>${item.type}</span>
        <span>${item.downloads.toLocaleString()} downloads</span>
      </div>
    `;
    
    templatesContainer.appendChild(templateItem);
  });
}

function generateCommunityContent() {
  const communityContainer = document.querySelector('.fu-community-content');
  if (!communityContainer) return;
  
  communityContainer.innerHTML = '';
  
  // Forums section
  const forumsSection = document.createElement('div');
  forumsSection.className = 'fu-community-section fu-mb-20';
  
  forumsSection.innerHTML = `
    <h3 class="fu-mb-10">Discussion Forums</h3>
    <div class="fu-forums-list"></div>
  `;
  
  const forumsList = forumsSection.querySelector('.fu-forums-list');
  
  APP.resourceData.community.forums.forEach(forum => {
    const forumItem = document.createElement('div');
    forumItem.className = 'fu-forum-item fu-mb-10';
    
    forumItem.innerHTML = `
      <div class="fu-resource-title">${forum.name}</div>
      <div class="fu-resource-meta">
        <span>${forum.topics} topics</span>
        <span>Last active: ${forum.lastActive}</span>
      </div>
    `;
    
    forumsList.appendChild(forumItem);
  });
  
  communityContainer.appendChild(forumsSection);
  
  // Groups section
  const groupsSection = document.createElement('div');
  groupsSection.className = 'fu-community-section fu-mb-20';
  
  groupsSection.innerHTML = `
    <h3 class="fu-mb-10">Study Groups</h3>
    <div class="fu-groups-list"></div>
  `;
  
  const groupsList = groupsSection.querySelector('.fu-groups-list');
  
  APP.resourceData.community.groups.forEach(group => {
    const groupItem = document.createElement('div');
    groupItem.className = 'fu-group-item fu-mb-10';
    
    groupItem.innerHTML = `
      <div class="fu-resource-title">${group.name}</div>
      <div class="fu-resource-description">${group.description}</div>
      <div class="fu-resource-meta">
        <span>${group.members} members</span>
      </div>
    `;
    
    groupsList.appendChild(groupItem);
  });
  
  communityContainer.appendChild(groupsSection);
  
  // Events section
  const eventsSection = document.createElement('div');
  eventsSection.className = 'fu-community-section';
  
  eventsSection.innerHTML = `
    <h3 class="fu-mb-10">Upcoming Events</h3>
    <div class="fu-events-list"></div>
  `;
  
  const eventsList = eventsSection.querySelector('.fu-events-list');
  
  APP.resourceData.community.events.forEach(event => {
    const eventItem = document.createElement('div');
    eventItem.className = 'fu-event-item fu-mb-10';
    
    eventItem.innerHTML = `
      <div class="fu-resource-title">${event.name}</div>
      <div class="fu-resource-meta">
        <span>${event.date}</span>
        <span>${event.format}</span>
      </div>
    `;
    
    eventsList.appendChild(eventItem);
  });
  
  communityContainer.appendChild(eventsSection);
}

// -------------------------
// MODAL FUNCTIONS
// -------------------------

function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = 'block';
  }
}

function saveProfileSettings() {
  // Get form values
  const name = document.getElementById('profileName').value;
  const email = document.getElementById('profileEmail').value;
  
  // Update user data
  APP.userData.name = name;
  APP.userData.email = email;
  
  // Save user data
  saveUserData();
  
  // Update UI
  document.getElementById('username').textContent = name;
  
  // Show confirmation
  alert('Profile settings saved successfully!');
}

// -------------------------
// UTILITY FUNCTIONS
// -------------------------

function calculateOverallProgress() {
  const totalChapters = Object.values(APP.moduleData).reduce((total, module) => {
    return total + module.chapters.length;
  }, 0);
  
  const completedChapters = APP.userData.completedChapters.length;
  
  return Math.round((completedChapters / totalChapters) * 100);
}

function calculateModuleProgress(moduleId) {
  const module = APP.moduleData[moduleId];
  if (!module) return 0;
  
  const totalChapters = module.chapters.length;
  const completedChapters = APP.userData.completedChapters.filter(id => id.startsWith(`${moduleId}.`)).length;
  
  return Math.round((completedChapters / totalChapters) * 100);
}
</script>
