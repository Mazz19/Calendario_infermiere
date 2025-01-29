if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
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

    let isInitialLoad = true;

    // Funzione per aggiungere un nuovo turno
    async function addNewShift(date, nurse, shiftType) {
        console.log("Tentativo di aggiungere turno:", date, nurse, shiftType);
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

            await shiftsCollection.add(shift);
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
            right: 'dayGridMonth,listWeek'
        },
        height: 'auto',
        selectable: true,
        editable: true,
        dayMaxEvents: true,

        eventContent: function(arg) {
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
            dateSelect.value = info.startStr;
            shiftModal.show();
        },

        eventClick: async function(info) {
            const eventId = info.event.extendedProps.docId;
            if (eventId && confirm('Vuoi eliminare questo turno?')) {
                try {
                    await shiftsCollection.doc(eventId).delete();
                } catch (error) {
                    console.error("Errore durante l'eliminazione:", error);
                    alert('Errore nell\'eliminare il turno: ' + error.message);
                }
            }
        }
    });

    // Carica iniziale degli eventi
    function loadEvents() {
        calendar.removeAllEvents();
        shiftsCollection.get().then((querySnapshot) => {
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                calendar.addEvent({
                    ...data,
                    extendedProps: {
                        ...data,
                        docId: doc.id
                    }
                });
            });
        });
    }

    // Ascolta i cambiamenti
    shiftsCollection.onSnapshot(() => {
        loadEvents();
    });

    // Gestione del pulsante "Aggiungi Turno"
    const addShiftBtn = document.getElementById('addShiftBtn');
    addShiftBtn.addEventListener('click', () => {
        if (window.innerWidth <= 768) {
            toggleSidebar();
        }
        const today = new Date().toISOString().split('T')[0];
        dateSelect.value = today;
        shiftModal.show();
    });

    // Gestione del form
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
    loadEvents();
});
