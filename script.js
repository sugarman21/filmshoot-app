document.addEventListener('DOMContentLoaded', function() {
    // App-Zustand
    let state = {
        selectedCamera: 'Canon EOS M',
        shots: [],
        activeShot: null,
        selectedRating: null
    };

    // DOM-Elemente
    const cameraButton = document.getElementById('cameraButton');
    const shotList = document.getElementById('shotList');
    const addShotButton = document.getElementById('addShotButton');
    const ratingButtons = document.querySelectorAll('#ratingButtons .rating-button');
    const notesInput = document.getElementById('notesInput');
    
    // Modals
    const shotDetailModal = document.getElementById('shotDetailModal');
    const modalShotName = document.getElementById('modalShotName');
    const modalRecordedDate = document.getElementById('modalRecordedDate');
    const modalFileSize = document.getElementById('modalFileSize');
    const modalShotNameInput = document.getElementById('modalShotNameInput');
    const modalNotesInput = document.getElementById('modalNotesInput');
    const modalRatingButtons = document.querySelectorAll('.modal-rating-buttons .rating-button');
    const modalCancelButton = document.getElementById('modalCancelButton');
    const modalSaveButton = document.getElementById('modalSaveButton');
    
    const cameraSelectModal = document.getElementById('cameraSelectModal');
    const cameraOptions = document.querySelectorAll('.camera-list li');
    const cameraModalCancelButton = document.getElementById('cameraModalCancelButton');

    // Mock-Daten laden
    loadMockData();
    renderShotList();

    // Event-Listener
    cameraButton.addEventListener('click', openCameraSelectModal);
    addShotButton.addEventListener('click', toggleShot);
    
    ratingButtons.forEach(button => {
        button.addEventListener('click', function() {
            const rating = this.dataset.rating;
            setRating(rating);
        });
    });
    
    notesInput.addEventListener('change', function() {
        if (state.activeShot) {
            state.activeShot.notes = this.value;
            saveState();
        }
    });
    
    modalCancelButton.addEventListener('click', closeShotDetailModal);
    modalSaveButton.addEventListener('click', saveAndCloseShotDetailModal);
    
    modalRatingButtons.forEach(button => {
        button.addEventListener('click', function() {
            modalRatingButtons.forEach(btn => btn.classList.remove('selected'));
            this.classList.add('selected');
        });
    });
    
    cameraOptions.forEach(option => {
        option.addEventListener('click', function() {
            const camera = this.dataset.camera;
            state.selectedCamera = camera;
            document.getElementById('selectedCamera').textContent = camera;
            closeCameraSelectModal();
            saveState();
        });
    });
    
    cameraModalCancelButton.addEventListener('click', closeCameraSelectModal);

    // Funktionen
    function loadMockData() {
        // Lade gespeicherte Daten, falls vorhanden
        const savedState = localStorage.getItem('filmshootState');
        if (savedState) {
            const parsed = JSON.parse(savedState);
            // Konvertiere String-Daten zurück zu Dates
            if (parsed.shots) {
                parsed.shots.forEach(shot => {
                    if (shot.timestamp) {
                        shot.timestamp = new Date(shot.timestamp);
                    }
                });
            }
            state = parsed;
            
            // UI aktualisieren
            document.getElementById('selectedCamera').textContent = state.selectedCamera;
            
            // Aktiver Shot wiederherstellen
            if (state.activeShot) {
                updateUIForActiveShot(true);
                if (state.activeShot.notes) {
                    notesInput.value = state.activeShot.notes;
                }
                if (state.activeShot.rating) {
                    highlightRatingButton(state.activeShot.rating);
                }
            }
            
            return;
        }
        
        // Andernfalls Mock-Daten verwenden
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        // Gestern
        state.shots.push(createShot("M14-2055.MLV", new Date(yesterday.setHours(20, 55)), "105,6 MB"));
        state.shots.push(createShot("M14-2102.MLV", new Date(yesterday.setHours(21, 2)), "1,1 GB"));
        state.shots.push(createShot("M14-2201.MLV", new Date(yesterday.setHours(22, 1)), "973,1 MB"));
        
        // Heute
        const today = new Date();
        state.shots.push(createShot("M16-1548.MLV", new Date(today.setHours(15, 48)), "92,2 MB"));
        state.shots.push(createShot("M16-1552.MLV", new Date(today.setHours(15, 52)), "1,21 GB"));
        state.shots.push(createShot("M16-1553.MLV", new Date(today.setHours(15, 53)), "1,81 GB"));
        state.shots.push(createShot("M16-1554.MLV", new Date(today.setHours(15, 54)), "2,15 GB"));
        state.shots.push(createShot("M16-1557.MLV", new Date(today.setHours(15, 57)), "2,68 GB"));
        state.shots.push(createShot("M16-1558.MLV", new Date(today.setHours(15, 58)), "1,01 GB"));
        state.shots.push(createShot("M16-1559.MLV", new Date(today.setHours(15, 59)), "2,41 GB"));
        state.shots.push(createShot("M16-1600.MLV", new Date(today.setHours(16, 0)), "1,01 GB"));
        state.shots.push(createShot("M16-1603.MLV", new Date(today.setHours(16, 3)), "1,06 GB"));
        
        saveState();
    }
    
    function createShot(filename, timestamp, fileSize) {
        return {
            id: Date.now() + Math.random().toString(36).substr(2, 9),
            filename,
            timestamp,
            fileSize,
            notes: "",
            rating: null,
            isActive: false
        };
    }
    
    function renderShotList() {
        shotList.innerHTML = '';
        
        state.shots.forEach(shot => {
            const shotItem = document.createElement('div');
            shotItem.className = 'shot-item';
            if (shot.isActive) {
                shotItem.classList.add('active');
            }
            
            if (shot.rating) {
                shotItem.classList.add(`rated-${shot.rating}`);
            }
            
            shotItem.dataset.id = shot.id;
            
            shotItem.innerHTML = `
                <div class="shot-indicator"></div>
                <div class="shot-details">
                    <div class="shot-filename">${shot.filename}</div>
                    <div class="shot-time">${formatDate(shot.timestamp)}</div>
                </div>
                <div class="shot-meta">
                    <div class="shot-size">${shot.fileSize}</div>
                    <div class="shot-type">Magic...rn Video</div>
                </div>
            `;
            
            shotItem.addEventListener('click', () => openShotDetailModal(shot));
            
            shotList.appendChild(shotItem);
        });
    }
    
    function formatDate(date) {
        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        const isToday = date.getDate() === today.getDate() && 
                         date.getMonth() === today.getMonth() && 
                         date.getFullYear() === today.getFullYear();
        
        const isYesterday = date.getDate() === yesterday.getDate() && 
                            date.getMonth() === yesterday.getMonth() && 
                            date.getFullYear() === yesterday.getFullYear();
        
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const timeString = `${hours}:${minutes}`;
        
        if (isToday) {
            return `Heute, ${timeString}`;
        } else if (isYesterday) {
            return `Vorgestern, ${timeString}`;
        } else {
            const day = date.getDate().toString().padStart(2, '0');
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const year = date.getFullYear();
            return `${day}.${month}.${year}, ${timeString}`;
        }
    }
    
    function toggleShot() {
        if (state.activeShot) {
            // Shot stoppen
            state.activeShot.isActive = false;
            state.activeShot = null;
            updateUIForActiveShot(false);
        } else {
            // Neuen Shot erstellen
            const newShot = {
                id: Date.now() + Math.random().toString(36).substr(2, 9),
                filename: generateFilename(),
                timestamp: new Date(),
                fileSize: "0 KB",
                notes: "",
                rating: null,
                isActive: true
            };
            
            state.shots.unshift(newShot);
            state.activeShot = newShot;
            updateUIForActiveShot(true);
        }
        
        renderShotList();
        saveState();
    }
    
    function generateFilename() {
        const now = new Date();
        const day = now.getDate().toString().padStart(2, '0');
        const hour = now.getHours().toString().padStart(2, '0');
        const minute = now.getMinutes().toString().padStart(2, '0');
        
        return `M${day}-${hour}${minute}.MLV`;
    }
    
    function updateUIForActiveShot(isActive) {
        if (isActive) {
            addShotButton.textContent = "Shot Stoppen";
            addShotButton.classList.add('active');
            
            // Rating-Buttons und Notes aktivieren
            ratingButtons.forEach(button => {
                button.disabled = false;
                button.style.opacity = "1";
            });
            
            notesInput.disabled = false;
            notesInput.style.opacity = "1";
            notesInput.value = state.activeShot.notes || '';
            
            // Rating-Button markieren, falls vorhanden
            if (state.activeShot.rating) {
                highlightRatingButton(state.activeShot.rating);
            } else {
                ratingButtons.forEach(button => button.classList.remove('selected'));
            }
        } else {
            addShotButton.innerHTML = '<img src="plus-icon.svg" alt="+" class="plus-icon"><span>Shot Hinzufügen</span>';
            addShotButton.classList.remove('active');
            
            // Rating-Buttons und Notes deaktivieren
            ratingButtons.forEach(button => {
                button.disabled = true;
                button.style.opacity = "0.5";
                button.classList.remove('selected');
            });
            
            notesInput.disabled = true;
            notesInput.style.opacity = "0.5";
            notesInput.value = '';
        }
    }
    
    function setRating(rating) {
        if (!state.activeShot) return;
        
        state.activeShot.rating = rating;
        highlightRatingButton(rating);
        renderShotList();
        saveState();
    }
    
    function highlightRatingButton(rating) {
        ratingButtons.forEach(button => {
            if (button.dataset.rating === rating) {
                button.classList.add('selected');
            } else {
                button.classList.remove('selected');
            }
        });
    }
    
    function openShotDetailModal(shot) {
        // Modal mit Shot-Daten füllen
        modalShotName.textContent = shot.filename;
        modalRecordedDate.textContent = `Recorded: ${formatDate(shot.timestamp)}`;
        modalFileSize.textContent = `Size: ${shot.fileSize}`;
        
        modalShotNameInput.value = shot.name || '';
        modalNotesInput.value = shot.notes || '';
        
        // Rating-Button markieren
        modalRatingButtons.forEach(button => {
            if (shot.rating && button.dataset.rating === shot.rating) {
                button.classList.add('selected');
            } else {
                button.classList.remove('selected');
            }
        });
        
        // Shot-ID im Button speichern
        modalSaveButton.dataset.shotId = shot.id;
        
        // Modal öffnen
        shotDetailModal.style.display = 'block';
    }
    
    function closeShotDetailModal() {
        shotDetailModal.style.display = 'none';
    }
    
    function saveAndCloseShotDetailModal() {
        const shotId = modalSaveButton.dataset.shotId;
        const shot = state.shots.find(s => s.id === shotId);
        
        if (shot) {
            // Daten aktualisieren
            shot.name = modalShotNameInput.value;
            shot.notes = modalNotesInput.value;
            
            // Rating ermitteln
            const selectedRatingButton = document.querySelector('.modal-rating-buttons .rating-button.selected');
            if (selectedRatingButton) {
                shot.rating = selectedRatingButton.dataset.rating;
            } else {
                shot.rating = null;
            }
            
            // UI aktualisieren
            if (state.activeShot && state.activeShot.id === shotId) {
                notesInput.value = shot.notes;
                if (shot.rating) {
                    highlightRatingButton(shot.rating);
                } else {
                    ratingButtons.forEach(button => button.classList.remove('selected'));
                }
            }
            
            renderShotList();
            saveState();
        }
        
        closeShotDetailModal();
    }
    
    function openCameraSelectModal() {
        cameraSelectModal.style.display = 'block';
    }
    
    function closeCameraSelectModal() {
        cameraSelectModal.style.display = 'none';
    }
    
    function saveState() {
        localStorage.setItem('filmshootState', JSON.stringify(state));
    }
});