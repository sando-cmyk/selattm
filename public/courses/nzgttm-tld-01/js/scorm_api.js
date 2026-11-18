var SCORM = (function () {
  var api = null;
  var initialized = false;
  function findAPI(win) {
    var attempts = 0;
    while (win && attempts < 10) {
      if (win.API) return win.API;
      if (win.parent && win.parent !== win) { win = win.parent; } else { break; }
      attempts++;
    }
    return null;
  }
  function getAPI() {
    if (api) return api;
    api = findAPI(window);
    if (!api && window.opener) api = findAPI(window.opener);
    return api;
  }
  function init() {
    var a = getAPI();
    if (a && !initialized) { a.LMSInitialize(""); initialized = true; }
    return initialized || !a;
  }
  function setValue(name, value) {
    var a = getAPI();
    if (a) { try { a.LMSSetValue(name, value); a.LMSCommit(""); } catch (e) {} }
  }
  function getValue(name) {
    var a = getAPI();
    if (a) { try { return a.LMSGetValue(name); } catch (e) { return ""; } }
    return "";
  }
  function setStatus(status) { setValue("cmi.core.lesson_status", status); }
  function setScore(score) {
    setValue("cmi.core.score.raw", String(score));
    setValue("cmi.core.score.min", "0");
    setValue("cmi.core.score.max", "100");
  }
  function setSuspendData(str) { setValue("cmi.suspend_data", str); }
  function getSuspendData() { return getValue("cmi.suspend_data"); }
  function finish() {
    var a = getAPI();
    if (a && initialized) { try { a.LMSFinish(""); } catch (e) {} }
  }
  window.addEventListener("beforeunload", finish);
  return {
    init: init, setStatus: setStatus, setScore: setScore,
    setSuspendData: setSuspendData, getSuspendData: getSuspendData,
    finish: finish, hasLMS: function () { return !!getAPI(); }
  };
})();
SCORM.init();
