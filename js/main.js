document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM caricato");
    
    // Riferimento alla collezione 'shifts' su Firestore
    const shiftsCollection = db.collection('shifts');
    const calendarEl = document.getElementById('calendar');
    
    // Definiamo la funzione prima di usarla
    async function addNewShift(date) {
        console.log("Tentativo di aggiungere turno per la data:", date);
        try {
            const nurseName = prompt('Nome dell\'infermiere:');
            console.log("Nome inserito:", nurseName);
            
            if (nurseName) {
                const shiftType = prompt('Tipo di turno (M=Mattina, P=Pomeriggio, N=Notte):');
                console.log("Tipo turno inserito:", shiftType);
                
                if (shiftType) {
                    const upperShiftType = shiftType.toUpperCase();
                    if (['M', 'P', 'N'].includes(upperShiftType)) {
                        const shift = {
                            title: `${nurseName} - Turno ${upperShiftType}`,
                            start: date,
                            nurse: nurseName,
                            shiftType: upperShiftType,
                            color: upperShiftType === 'M' ? '#4CAF50' : 
                                   upperShiftType === 'P' ? '#2196F3' : '#9C27B0'
                        };

                        console.log("Tentativo di salvare il turno:", shift);
                        await shiftsCollection.add(shift);
                        calendar.addEvent(shift);
                        console.log("Turno salvato con successo");
                    } else {
                        alert('Tipo turno non valido. Usa M, P o N.');
                    }
                }
            }
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
            console.log("Data selezionata:", info.startStr);
            addNewShift(info.startStr);
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
        console.log("Pulsante Aggiungi Turno cliccato");
        const today = new Date().toISOString().split('T')[0];
        addNewShift(today);
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

    // Chiudi sidebar quando viene aggiunto un turno su mobile
    addShiftBtn.addEventListener('click', () => {
        if (window.innerWidth <= 768) {
            toggleSidebar();
        }
        // ... resto del codice per aggiungere il turno ...
    });

    // Aggiorna il calendario quando cambia l'orientamento del dispositivo
    window.addEventListener('resize', () => {
        calendar.updateSize();
    });

    calendar.render();
    console.log("Calendario renderizzato");
});
