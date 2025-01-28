if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then((registration) => {
                console.log('ServiceWorker registrato con successo:', registration.scope);
            })
            .catch((error) => {
                console.log('Registrazione ServiceWorker fallita:', error);
            });
    });
}

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
    const dateSelect = document.getElementById('dateSelect');
    
    // Imposta la data minima al giorno corrente
    const today = new Date().toISOString().split('T')[0];
    dateSelect.min = today;

    // Definiamo la funzione prima di usarla
    async function addNewShift(date, nurse, shiftType) {
        try {
            const shift = {
                title: `${nurse} - Turno ${shiftType}`,
                start: date,
                nurse: nurse,
                shiftType: shiftType,
                color: shiftType === 'M' ? '#4CAF50' :
                       shiftType === 'P' ? '#2196F3' :
                       shiftType === 'R' ? '#838383' :
                       shiftType === 'G' ? '#d3741c' : '#9C27B0'
            };

            const docRef = await shiftsCollection.add(shift);
            shift.id = docRef.id; // Aggiungi l'ID del documento
            shiftModal.hide();
            shiftForm.reset();
        } catch (error) {
            console.error("Errore durante il salvataggio:", error);
            alert('Errore nel salvare il turno: ' + error.message);
        }
    }

    const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        locale: 'it',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,listWeek'
        },
        height: 'auto',
        selectable: true,
        editable: true,
        
        views: {
            listWeek: {
                listDayFormat: { 
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long'
                },
                listDaySideFormat: false, // Nasconde la data nella colonna laterale
                displayEventTime: false // Nasconde l'orario degli eventi
            }
        },

        // Personalizzazione del contenuto degli eventi
        eventContent: function(arg) {
            // Contenuto personalizzato per gli eventi
            if (arg.view.type === 'dayGridMonth') {
                return {
                    html: `
                        <div class="month-event-content">
                            <div class="month-event-type">${arg.event.extendedProps.shiftType}</div>
                            <div class="month-event-nurse">${arg.event.extendedProps.nurse}</div>
                        </div>
                    `
                };
            } else {
                // Mantieni il formato esistente per la vista lista
                return {
                    html: `
                        <div class="list-event-container">
                            <div class="list-event-type type-${arg.event.extendedProps.shiftType}">
                                ${arg.event.extendedProps.shiftType}
                            </div>
                            <div class="list-event-nurse">
                                ${arg.event.extendedProps.nurse}
                            </div>
                        </div>
                    `
                };
            }
        },

        select: function(info) {
            selectedDate = info.startStr;
            shiftDateInput.value = selectedDate;
            shiftModal.show();
        },

        eventClick: async function(info) {
            if (confirm('Vuoi eliminare questo turno?')) {
                try {
                    await shiftsCollection.doc(info.event.id).delete();
                    info.event.remove();
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
        },

        // Aumenta l'altezza delle celle del mese
        dayCellDidMount: function(arg) {
            arg.el.style.height = '120px';
        }
    });

    // Gestione del pulsante "Aggiungi Turno"
    const addShiftBtn = document.getElementById('addShiftBtn');
    addShiftBtn.addEventListener('click', () => {
        if (window.innerWidth <= 768) {
            toggleSidebar();
        }
        dateSelect.value = today;
        shiftModal.show();
    });

    // Quando si apre il modale cliccando su un giorno del calendario
    calendar.on('select', function(info) {
        dateSelect.value = info.startStr;
        shiftModal.show();
    });

    // Gestione del pulsante "Salva" nel modale
    document.getElementById('saveShift').addEventListener('click', () => {
        if (dateSelect.value && nurseSelect.value && shiftSelect.value) {
            addNewShift(dateSelect.value, nurseSelect.value, shiftSelect.value);
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

    // Funzione per aggiornare il calendario
    function updateCalendar() {
        // Rimuovi tutti gli eventi esistenti
        calendar.removeAllEvents();
        
        // Carica gli eventi aggiornati
        shiftsCollection.get().then((querySnapshot) => {
            const events = [];
            querySnapshot.forEach((doc) => {
                events.push(doc.data());
            });
            calendar.addEventSource(events);
        });
    }

    // Ascolta i cambiamenti in tempo reale
    shiftsCollection.onSnapshot((snapshot) => {
        snapshot.docChanges().forEach((change) => {
            if (change.type === "added") {
                console.log("Nuovo turno aggiunto");
                calendar.addEvent(change.doc.data());
            }
            if (change.type === "modified") {
                console.log("Turno modificato");
                // Rimuovi il vecchio evento e aggiungi quello aggiornato
                const eventData = change.doc.data();
                const existingEvent = calendar.getEventById(change.doc.id);
                if (existingEvent) {
                    existingEvent.remove();
                }
                calendar.addEvent({...eventData, id: change.doc.id});
            }
            if (change.type === "removed") {
                console.log("Turno rimosso");
                const existingEvent = calendar.getEventById(change.doc.id);
                if (existingEvent) {
                    existingEvent.remove();
                }
            }
        });
    }, (error) => {
        console.error("Errore nell'ascolto dei cambiamenti:", error);
    });

    calendar.render();
    console.log("Calendario renderizzato");
});
