document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM caricato");
    
    // Riferimento alla collezione 'shifts' su Firestore
    const shiftsCollection = db.collection('shifts');
    const calendarEl = document.getElementById('calendar');
    
    let selectedDate = null;
    const shiftModal = new bootstrap.Modal(document.getElementById('shiftModal'));
    const shiftForm = document.getElementById('shiftForm');
    const nurseSelect = document.getElementById('nurseSelect');
    const shiftSelect = document.getElementById('shiftSelect');
    const shiftDateInput = document.getElementById('shiftDate');
    
    // Definiamo la funzione prima di usarla
    async function addNewShift(date, nurse, shiftType) {
        try {
            const shift = {
                title: `${nurse} - ${shiftType}`,
                start: date,
                nurse: nurse,
                shiftType: shiftType,
                color: shiftType === 'M' ? '#4CAF50' : 
                       shiftType === 'P' ? '#2196F3' : '#9C27B0'
            };

            await shiftsCollection.add(shift);
            calendar.addEvent(shift);
            shiftModal.hide();
            shiftForm.reset();
        } catch (error) {
            console.error("Errore durante il salvataggio:", error);
            alert('Errore nel salvare il turno: ' + error.message);
        }
    }

    let calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        locale: 'it',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth'
        },
        height: 'auto',
        selectable: true,
        editable: true,
        dayMaxEvents: true,
        
        select: function(info) {
            selectedDate = info.startStr;
            shiftDateInput.value = selectedDate;
            shiftModal.show();
        },

        eventClick: async function(info) {
            console.log("Evento cliccato:", info.event);
            if (confirm('Vuoi eliminare questo turno?')) {
                try {
                    const querySnapshot = await shiftsCollection
                        .where('start', '==', info.event.startStr)
                        .where('nurse', '==', info.event.extendedProps.nurse)
                        .get();
                    
                    querySnapshot.forEach((doc) => {
                        doc.ref.delete();
                    });

                    info.event.remove();
                    console.log("Turno eliminato con successo");
                } catch (error) {
                    console.error("Errore durante l'eliminazione:", error);
                    alert('Errore nell\'eliminare il turno: ' + error.message);
                }
            }
        },

        // Carica gli eventi all'avvio
        events: async function(info, successCallback, failureCallback) {
            try {
                const querySnapshot = await shiftsCollection.get();
                const events = [];
                querySnapshot.forEach((doc) => {
                    events.push(doc.data());
                });
                successCallback(events);
            } catch (error) {
                failureCallback(error);
            }
        }
    });

    // Gestione del pulsante "Aggiungi Turno"
    const addShiftBtn = document.getElementById('addShiftBtn');
    addShiftBtn.addEventListener('click', () => {
        if (window.innerWidth <= 768) {
            toggleSidebar();
        }
        selectedDate = new Date().toISOString().split('T')[0];
        shiftDateInput.value = selectedDate;
        shiftModal.show();
    });

    // Gestione del pulsante "Salva" nel modale
    document.getElementById('saveShift').addEventListener('click', () => {
        if (nurseSelect.value && shiftSelect.value) {
            addNewShift(shiftDateInput.value, nurseSelect.value, shiftSelect.value);
        } else {
            alert('Per favore, compila tutti i campi');
        }
    });

    // Gestione Sidebar Mobile
    const sidebarToggler = document.querySelector('.sidebar-toggler');
    const sidebarContainer = document.querySelector('.sidebar-container');
    const sidebarOverlay = document.querySelector('.sidebar-overlay');
    const sidebarClose = document.querySelector('.sidebar-close');

    function toggleSidebar() {
        sidebarContainer.classList.toggle('active');
        sidebarOverlay.classList.toggle('active');
        document.body.style.overflow = sidebarContainer.classList.contains('active') ? 'hidden' : '';
    }

    sidebarToggler.addEventListener('click', toggleSidebar);
    sidebarOverlay.addEventListener('click', toggleSidebar);
    sidebarClose.addEventListener('click', toggleSidebar);

    // Aggiorna il calendario quando cambia l'orientamento del dispositivo
    window.addEventListener('resize', () => {
        calendar.updateSize();
    });

    calendar.render();
    console.log("Calendario renderizzato");
});
