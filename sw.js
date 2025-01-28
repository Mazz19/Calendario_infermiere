<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Turni Infermieri</title>

    <!-- Meta tag per PWA -->
    <meta name="theme-color" content="#4a90e2">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <meta name="apple-mobile-web-app-title" content="Turni">
    
    <!-- Icon per iOS -->
    <link rel="apple-touch-icon" href="icons/icon-152x152.png">
    <link rel="apple-touch-icon" sizes="152x152" href="icons/icon-152x152.png">
    <link rel="apple-touch-icon" sizes="180x180" href="icons/icon-180x180.png">
    <link rel="apple-touch-icon" sizes="167x167" href="icons/icon-167x167.png">
    
    <!-- Splash screen per iOS -->
    <link rel="apple-touch-startup-image" href="splash/launch-640x1136.png" media="(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2)">
    <link rel="apple-touch-startup-image" href="splash/launch-750x1294.png" media="(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)">
    <link rel="apple-touch-startup-image" href="splash/launch-1242x2148.png" media="(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3)">
    <link rel="apple-touch-startup-image" href="splash/launch-1125x2436.png" media="(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)">
    
    <!-- Web App Manifest -->
    <link rel="manifest" href="manifest.json">
    
    <!-- Bootstrap CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    
    <!-- FullCalendar Bundle -->
    <script src='https://cdn.jsdelivr.net/npm/fullcalendar@6.1.10/index.global.min.js'></script>
    
    <!-- Google Fonts -->
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600&display=swap" rel="stylesheet">
    
    <!-- Font Awesome -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    
    <!-- Custom CSS -->
    <link href="css/style.css" rel="stylesheet">
</head>
<body>
    <div class="main-container">
        <nav class="navbar navbar-expand-lg navbar-dark">
            <div class="container">
                <span class="navbar-brand">
                    <i class="fas fa-calendar-alt"></i> Calendario condiviso
                </span>
                <button class="navbar-toggler sidebar-toggler" type="button">
                    <i class="fas fa-bars"></i>
                </button>
            </div>
        </nav>

        <div class="container my-4">
            <div class="row">
                <div class="col-md-3 mb-4 sidebar-container">
                    <div class="sidebar-card">
                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <h5 class="card-title mb-0">
                                <i class="fas fa-plus-circle"></i> Azioni
                            </h5>
                            <button class="btn-close sidebar-close d-md-none" aria-label="Close"></button>
                        </div>
                        <button id="addShiftBtn" class="btn btn-primary w-100 mb-3">
                            <i class="fas fa-plus"></i> Aggiungi Turno
                        </button>
                        
                        <h5 class="card-title mt-4">
                            <i class="fas fa-info-circle"></i> Legenda
                        </h5>
                        <div class="shift-types">
                            <div class="shift-type">
                                <span class="badge bg-success">M</span>
                                Mattina
                            </div>
                            <div class="shift-type">
                                <span class="badge bg-primary">P</span>
                                Pomeriggio
                            </div>
                            <div class="shift-type">
                                <span class="badge bg-orange">G</span>
                                Giornata
                            </div>
                            <div class="shift-type">
                                <span class="badge bg-purple">N</span>
                                Notte
                            </div>
                            <div class="shift-type">
                                <span class="badge bg-gray">R</span>
                                Riposo
                            </div>
                        </div>
                        <div class="instructions mt-4">
                            <h5 class="card-title">
                                <i class="fas fa-question-circle"></i> Guida
                            </h5>
                            <ul class="small-text">
                                <li>Clicca su un turno esistente per eliminarlo</li>
                            </ul>
                        </div>
                    </div>
                </div>
                
                <div class="col-md-9">
                    <div class="calendar-card">
                        <div id="calendar"></div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div class="sidebar-overlay"></div>

    <!-- Aggiungiamo il modale per l'inserimento turni -->
    <div class="modal fade" id="shiftModal" tabindex="-1" aria-labelledby="shiftModalLabel" aria-hidden="true">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="shiftModalLabel">Inserisci Turno</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <form id="shiftForm">
                        <div class="mb-3">
                            <label for="dateSelect" class="form-label">Data</label>
                            <input type="date" class="form-select" id="dateSelect" required>
                        </div>
                        <div class="mb-3">
                            <label for="nurseSelect" class="form-label">Infermiere</label>
                            <select class="form-select" id="nurseSelect" required>
                                <option value="Fra">Fra</option>
                                <option value="Sarah">Sarah</option>
                                <option value="Lisa">Lisa</option>
                                <option value="Dome">Dome</option>
                            </select>
                        </div>
                        <div class="mb-3">
                            <label for="shiftSelect" class="form-label">Tipo Turno</label>
                            <select class="form-select" id="shiftSelect" required>
                                <option value="">Seleziona turno...</option>
                                <option value="M">Mattina (M)</option>
                                <option value="P">Pomeriggio (P)</option>
                                <option value="G">Giornata (G)</option>
                                <option value="N">Notte (N)</option>
                                <option value="R">Riposo (R)</option>
                            </select>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Annulla</button>
                    <button type="button" class="btn btn-primary" id="saveShift">Salva</button>
                </div>
            </div>
        </div>
    </div>
    <footer>
        <div class="container my-4">
            <p>Powered by <a href="https://www.linkedin.com/in/mattia-luzzi-4410121b5/" target="_blank">Mazz</a></p>
        </div>
    </footer>
    <!-- Firebase -->
    <script src="https://www.gstatic.com/firebasejs/8.10.0/firebase-app.js"></script>
    <script src="https://www.gstatic.com/firebasejs/8.10.0/firebase-firestore.js"></script>
    
    <!-- Custom JS -->
    <script src="js/firebase-config.js"></script>
    <script src="js/main.js"></script>

    <!-- Aggiungiamo Bootstrap JS -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html> 