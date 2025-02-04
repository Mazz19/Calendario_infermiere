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
                       shiftType === 'G' ? '#d3741c' :
                       shiftType === 'REP' ? '#ff0000' : '#9C27B0'
            };

            // Salva su Firebase ma NON aggiungere l'evento al calendario
            await shiftsCollection.add(shift);
            
            // Ricarica tutti gli eventi dal database
            calendar.refetchEvents();
            
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

        eventContent: function(arg) {
            // Verifica se siamo su mobile
            const isMobile = window.innerWidth < 768;
            
            if (arg.view.type === 'dayGridMonth') {
                // Usa una versione più compatta per mobile
                if (isMobile) {
                    return {
                        html: `
                            <div class="month-event-content mobile">
                                <div class="month-event-type">${arg.event.extendedProps.shiftType}</div>
                                <div class="month-event-nurse">${arg.event.extendedProps.nurse.split(' ')[0]}</div>
                            </div>
                        `
                    };
                } else {
                    // Versione desktop normale
                    return {
                        html: `
                            <div class="month-event-content">
                                <div class="month-event-type">${arg.event.extendedProps.shiftType}</div>
                                <div class="month-event-nurse">${arg.event.extendedProps.nurse}</div>
                            </div>
                        `
                    };
                }
            } else {
                // Vista lista (invariata)
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
    
        // Imposta un limite di eventi visibili per giorno su mobile
        dayMaxEvents: function() {
            return window.innerWidth < 768 ? 4 : true;
        },

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

    calendar.render();
    console.log("Calendario renderizzato");
});
