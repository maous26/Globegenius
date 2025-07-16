"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var react_query_1 = require("@tanstack/react-query");
var framer_motion_1 = require("framer-motion");
var lucide_react_1 = require("lucide-react");
var date_fns_1 = require("date-fns");
var locale_1 = require("date-fns/locale");
var AuthContext_1 = require("../contexts/AuthContext");
var api_1 = require("../services/api");
var react_hot_toast_1 = require("react-hot-toast");
var DashboardPage = function () {
    var _a;
    var user = (0, AuthContext_1.useAuth)().user;
    var _b = (0, react_1.useState)(null), selectedAlert = _b[0], setSelectedAlert = _b[1];
    var _c = (0, react_1.useState)('active'), filterStatus = _c[0], setFilterStatus = _c[1];
    // Requête pour récupérer les alertes
    var _d = (0, react_query_1.useQuery)({
        queryKey: ['alerts', filterStatus],
        queryFn: function () { return api_1.alertService.getAlerts({
            status: filterStatus === 'all' ? undefined : filterStatus,
            limit: 50
        }); },
        refetchInterval: 60000, // Rafraîchir toutes les minutes
    }), alertsData = _d.data, alertsLoading = _d.isLoading, refetchAlerts = _d.refetch;
    // Requête pour les statistiques
    var statsData = (0, react_query_1.useQuery)({
        queryKey: ['alertStats'],
        queryFn: function () { return api_1.alertService.getStats(); },
    }).data;
    // Requête pour les métriques temps réel
    var metricsData = (0, react_query_1.useQuery)({
        queryKey: ['realtimeMetrics'],
        queryFn: function () { return api_1.metricsService.getRealtime(); },
        refetchInterval: 30000, // Rafraîchir toutes les 30 secondes
    }).data;
    var alerts = ((_a = alertsData === null || alertsData === void 0 ? void 0 : alertsData.data) === null || _a === void 0 ? void 0 : _a.alerts) || [];
    var stats = statsData === null || statsData === void 0 ? void 0 : statsData.data;
    // Marquer une alerte comme ouverte
    var handleAlertOpen = function (alert) { return __awaiter(void 0, void 0, void 0, function () {
        var error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!!alert.isOpened) return [3 /*break*/, 4];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, api_1.alertService.markAsOpened(alert.id)];
                case 2:
                    _a.sent();
                    refetchAlerts();
                    return [3 /*break*/, 4];
                case 3:
                    error_1 = _a.sent();
                    console.error('Erreur marquage alerte:', error_1);
                    return [3 /*break*/, 4];
                case 4:
                    setSelectedAlert(alert);
                    return [2 /*return*/];
            }
        });
    }); };
    // Gérer le clic sur le bouton de réservation
    var handleBookingClick = function (alert) { return __awaiter(void 0, void 0, void 0, function () {
        var response, bookingUrl, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, api_1.alertService.markAsClicked(alert.id)];
                case 1:
                    response = _a.sent();
                    bookingUrl = response.data.bookingUrl;
                    // Ouvrir dans un nouvel onglet
                    window.open(bookingUrl, '_blank');
                    react_hot_toast_1.toast.success('Redirection vers la réservation...');
                    refetchAlerts();
                    return [3 /*break*/, 3];
                case 2:
                    error_2 = _a.sent();
                    react_hot_toast_1.toast.error('Erreur lors de la redirection');
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); };
    // Envoyer un feedback
    var handleFeedback = function (alertId, useful) { return __awaiter(void 0, void 0, void 0, function () {
        var error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, api_1.alertService.submitFeedback(alertId, { useful: useful })];
                case 1:
                    _a.sent();
                    react_hot_toast_1.toast.success(useful ? 'Merci pour votre feedback positif !' : 'Merci, nous améliorerons nos suggestions');
                    setSelectedAlert(null);
                    return [3 /*break*/, 3];
                case 2:
                    error_3 = _a.sent();
                    react_hot_toast_1.toast.error('Erreur envoi feedback');
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); };
    // Indicateur de nouvelles alertes
    var newAlertsCount = alerts.filter(function (a) { return !a.isOpened; }).length;
    return (<div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <framer_motion_1.motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <lucide_react_1.Globe className="w-8 h-8 text-purple-400"/>
              Tableau de bord
            </h1>
            {newAlertsCount > 0 && (<div className="flex items-center gap-2 bg-green-500/20 border border-green-500 rounded-full px-4 py-2">
                <lucide_react_1.Bell className="w-5 h-5 text-green-400"/>
                <span className="text-green-400 font-semibold">
                  {newAlertsCount} nouvelle{newAlertsCount > 1 ? 's' : ''} alerte{newAlertsCount > 1 ? 's' : ''}
                </span>
              </div>)}
          </div>
          <p className="text-slate-400">
            Bonjour {user === null || user === void 0 ? void 0 : user.email}, voici vos alertes de voyage personnalisées
          </p>
        </framer_motion_1.motion.div>

        {/* Stats Cards */}
        {stats && (<framer_motion_1.motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-purple-600/20 rounded-xl">
                  <lucide_react_1.TrendingDown className="w-6 h-6 text-purple-400"/>
                </div>
                <span className="text-2xl font-bold">{stats.summary.avgDiscount}%</span>
              </div>
              <h3 className="text-sm text-slate-400">Réduction moyenne</h3>
            </div>

            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-green-600/20 rounded-xl">
                  <lucide_react_1.Sparkles className="w-6 h-6 text-green-400"/>
                </div>
                <span className="text-2xl font-bold">{stats.summary.totalSavings}€</span>
              </div>
              <h3 className="text-sm text-slate-400">Économies totales</h3>
            </div>

            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-600/20 rounded-xl">
                  <lucide_react_1.Bell className="w-6 h-6 text-blue-400"/>
                </div>
                <span className="text-2xl font-bold">{stats.summary.totalAlerts}</span>
              </div>
              <h3 className="text-sm text-slate-400">Alertes reçues</h3>
            </div>

            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-pink-600/20 rounded-xl">
                  <lucide_react_1.Zap className="w-6 h-6 text-pink-400"/>
                </div>
                <span className="text-2xl font-bold">{stats.summary.clickRate}%</span>
              </div>
              <h3 className="text-sm text-slate-400">Taux de clic</h3>
            </div>
          </framer_motion_1.motion.div>)}

        {/* Filters */}
        <framer_motion_1.motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="flex items-center gap-4 mb-6">
          <button onClick={function () { return setFilterStatus('active'); }} className={"px-4 py-2 rounded-xl transition ".concat(filterStatus === 'active'
            ? 'bg-purple-600 text-white'
            : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800')}>
            Alertes actives
          </button>
          <button onClick={function () { return setFilterStatus('expired'); }} className={"px-4 py-2 rounded-xl transition ".concat(filterStatus === 'expired'
            ? 'bg-purple-600 text-white'
            : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800')}>
            Expirées
          </button>
          <button onClick={function () { return setFilterStatus('all'); }} className={"px-4 py-2 rounded-xl transition ".concat(filterStatus === 'all'
            ? 'bg-purple-600 text-white'
            : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800')}>
            Toutes
          </button>
        </framer_motion_1.motion.div>

        {/* Alerts List */}
        <framer_motion_1.motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="space-y-4">
          {alertsLoading ? (<div className="text-center py-12">
              <div className="loading-spinner mx-auto mb-4"/>
              <p className="text-slate-400">Chargement des alertes...</p>
            </div>) : alerts.length === 0 ? (<div className="glass-card p-12 text-center">
              <lucide_react_1.Bell className="w-12 h-12 text-slate-600 mx-auto mb-4"/>
              <h3 className="text-xl font-semibold mb-2">Aucune alerte pour le moment</h3>
              <p className="text-slate-400">
                Nous surveillons les prix 24h/24. Vous recevrez une notification dès qu'un deal exceptionnel sera détecté !
              </p>
            </div>) : (alerts.map(function (alert) { return (<framer_motion_1.motion.div key={alert.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} whileHover={{ x: 4 }} onClick={function () { return handleAlertOpen(alert); }} className={"glass-card p-6 cursor-pointer transition-all ".concat(!alert.isOpened ? 'border-green-500/50' : '')}>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-3">
                      {!alert.isOpened && (<span className="pulse-dot text-green-400"/>)}
                      <h3 className="text-xl font-semibold flex items-center gap-2">
                        <lucide_react_1.Plane className="w-5 h-5 text-purple-400"/>
                        {alert.route}
                      </h3>
                      <span className="badge badge-error">
                        -{alert.discount}%
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-slate-400">Prix</span>
                        <p className="font-semibold text-lg">
                          {alert.price}€
                          <span className="text-sm text-slate-500 line-through ml-2">
                            {alert.originalPrice}€
                          </span>
                        </p>
                      </div>
                      <div>
                        <span className="text-slate-400">Dates</span>
                        <p className="font-medium">
                          {(0, date_fns_1.format)(new Date(alert.departureDate), 'dd MMM', { locale: locale_1.fr })} - 
                          {(0, date_fns_1.format)(new Date(alert.returnDate), 'dd MMM', { locale: locale_1.fr })}
                        </p>
                      </div>
                      <div>
                        <span className="text-slate-400">Compagnie</span>
                        <p className="font-medium">{alert.airline}</p>
                      </div>
                      <div>
                        <span className="text-slate-400">Expire</span>
                        <p className="font-medium text-orange-400">
                          {(0, date_fns_1.formatDistanceToNow)(new Date(alert.expiresAt), {
                addSuffix: true,
                locale: locale_1.fr
            })}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <lucide_react_1.ChevronRight className="w-6 h-6 text-slate-400 ml-4"/>
                </div>
              </framer_motion_1.motion.div>); }))}
        </framer_motion_1.motion.div>

        {/* Alert Detail Modal */}
        <framer_motion_1.AnimatePresence>
          {selectedAlert && (<framer_motion_1.motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6" onClick={function () { return setSelectedAlert(null); }}>
              <framer_motion_1.motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={function (e) { return e.stopPropagation(); }} className="glass-card p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold">Détails de l'offre</h2>
                  <button onClick={function () { return setSelectedAlert(null); }} className="p-2 hover:bg-slate-800 rounded-xl transition">
                    <lucide_react_1.X className="w-6 h-6"/>
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Route et prix */}
                  <div className="bg-gradient-to-r from-green-600/20 to-emerald-600/20 border border-green-500 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-3xl font-bold">{selectedAlert.route}</h3>
                      <span className="text-4xl font-bold text-green-400">
                        {selectedAlert.price}€
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="badge badge-success">
                        Économisez {selectedAlert.savings}€
                      </span>
                      <span className="badge badge-error">
                        -{selectedAlert.discount}%
                      </span>
                    </div>
                  </div>

                  {/* Détails du vol */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="glass-card p-4">
                      <div className="flex items-center gap-2 mb-2 text-slate-400">
                        <lucide_react_1.Calendar className="w-4 h-4"/>
                        <span>Dates du voyage</span>
                      </div>
                      <p className="font-semibold">
                        {(0, date_fns_1.format)(new Date(selectedAlert.departureDate), 'dd MMMM yyyy', { locale: locale_1.fr })}
                      </p>
                      <p className="text-sm text-slate-400">au</p>
                      <p className="font-semibold">
                        {(0, date_fns_1.format)(new Date(selectedAlert.returnDate), 'dd MMMM yyyy', { locale: locale_1.fr })}
                      </p>
                    </div>
                    <div className="glass-card p-4">
                      <div className="flex items-center gap-2 mb-2 text-slate-400">
                        <lucide_react_1.Plane className="w-4 h-4"/>
                        <span>Compagnie</span>
                      </div>
                      <p className="font-semibold text-lg">{selectedAlert.airline}</p>
                      <p className="text-sm text-slate-400 mt-2">
                        <lucide_react_1.Clock className="w-4 h-4 inline mr-1"/>
                        Expire {(0, date_fns_1.formatDistanceToNow)(new Date(selectedAlert.expiresAt), {
                addSuffix: true,
                locale: locale_1.fr
            })}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-4">
                    <button onClick={function () { return handleBookingClick(selectedAlert); }} className="flex-1 btn-glow py-4 rounded-xl font-semibold flex items-center justify-center gap-2">
                      <lucide_react_1.Zap className="w-5 h-5"/>
                      Réserver maintenant
                    </button>
                  </div>

                  {/* Feedback */}
                  <div className="border-t border-slate-800 pt-6">
                    <p className="text-sm text-slate-400 mb-3">Cette alerte vous a-t-elle été utile ?</p>
                    <div className="flex gap-4">
                      <button onClick={function () { return handleFeedback(selectedAlert.id, true); }} className="flex items-center gap-2 px-4 py-2 bg-green-600/20 hover:bg-green-600/30 border border-green-500 rounded-xl transition">
                        <lucide_react_1.Check className="w-4 h-4"/>
                        Oui, très utile
                      </button>
                      <button onClick={function () { return handleFeedback(selectedAlert.id, false); }} className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 hover:bg-slate-800 rounded-xl transition">
                        <lucide_react_1.X className="w-4 h-4"/>
                        Pas intéressé
                      </button>
                    </div>
                  </div>
                </div>
              </framer_motion_1.motion.div>
            </framer_motion_1.motion.div>)}
        </framer_motion_1.AnimatePresence>
      </div>
    </div>);
};
exports.default = DashboardPage;
