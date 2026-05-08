pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

/*
==================================================
CONFIG — SAFE TO EDIT

Add/change:
- systems
- device names
- prefixes
- colors
- icon paths
==================================================
*/

const CONFIG = {
  requireProjectName: true,
  pdfRenderScale: 1.5,

  note: {
    symbol: "N",
    prefix: "NOTE",
    label: "Note",
    color: "#7c3aed",
    iconSize: 16
  },

  fov: {
    enabledFor: ["camera", "camera360"],
    defaultType: "directional",
    color: "#dc2626",

    /*
      FOV now always fully visible.
      Removed opacity slider workflow.
    */
    opacity: 1,

    size: 70,
    lineWidth: 5,
    arrowHead: 12
  }
};

/*
==================================================
DEVICE / SYSTEM LIBRARY
==================================================
*/

const appState = {
  projectName: "",
  hasLoadedDrawing: false,
  hasUnsavedChanges: false,
  hasMarkers: false,
  lastSavedAt: null,
  currentMode: "view", // view | plotting | note | fov
};

const defaultSystems = {
  networking: {
    label: "Networking",
    color: "#2563eb",

    items: {
      singleDrop: {
        label: "Single Drop",
        symbol: "SD1",
        prefix: "SD",
        iconImage: "icons/singleDrop.jpg",
        iconSize: 16
      },

      dualDrop: {
        label: "Dual Drop",
        symbol: "DD2",
        prefix: "DD",
        iconImage: "icons/dualDrop.png",
        iconSize: 16
      },

      quadDrop: {
        label: "Quad Drop",
        symbol: "QD4",
        prefix: "QD",
        iconImage: "icons/quadDrop.png",
        iconSize: 16
      },

      ceilingDrop: {
        label: "Ceiling Drop",
        symbol: "CD",
        prefix: "CD",
        iconImage: null,
        iconSize: 16
      },

      floorBox: {
        label: "Floor Box",
        symbol: "FB",
        prefix: "FB",
        iconImage: null,
        iconSize: 18
      },

      fiberDrop: {
        label: "Fiber Drop",
        symbol: "FIB",
        prefix: "FIB",
        iconImage: null,
        iconSize: 18
      },

      wap: {
        label: "WAP",
        symbol: "WAP",
        prefix: "WAP",
        iconImage: "icons/wifi-wap.png",
        iconSize: 18
      },

      outdoorWap: {
        label: "Outdoor WAP",
        symbol: "OWAP",
        prefix: "OWAP",
        iconImage: null,
        iconSize: 18
      },

      switch: {
        label: "Switch",
        symbol: "SW",
        prefix: "SW",
        iconImage: null,
        iconSize: 18
      },

      router: {
        label: "Router",
        symbol: "RTR",
        prefix: "RTR",
        iconImage: null,
        iconSize: 18
      },

      firewall: {
        label: "Firewall",
        symbol: "FW",
        prefix: "FW",
        iconImage: null,
        iconSize: 18
      },

      patchPanel: {
        label: "Patch Panel",
        symbol: "PP",
        prefix: "PP",
        iconImage: null,
        iconSize: 18
      },

      ups: {
        label: "UPS",
        symbol: "UPS",
        prefix: "UPS",
        iconImage: null,
        iconSize: 18
      }
    }
  },

  endpoints: {
    label: "Endpoints",
    color: "#dc2626",

    items: {
      camera: {
        label: "Camera",
        symbol: "CAM",
        prefix: "CAM",
        iconImage: "icons/cctv.png",
        iconSize: 17
      },

      camera360: {
        label: "360 Camera",
        symbol: "360",
        prefix: "CAM360",
        iconImage: null,
        iconSize: 17
      },

      ptzCamera: {
        label: "PTZ Camera",
        symbol: "PTZ",
        prefix: "PTZ",
        iconImage: null,
        iconSize: 17
      },

      cardReader: {
        label: "Card Reader",
        symbol: "CR",
        prefix: "CR",
        iconImage: "icons/cardReader.png",
        iconSize: 16
      },

      doorContact: {
        label: "Door Contact",
        symbol: "DC",
        prefix: "DC",
        iconImage: "icons/doorContact.png",
        iconSize: 16
      },

      rex: {
        label: "REX",
        symbol: "REX",
        prefix: "REX",
        iconImage: "icons/reqToExit.png",
        iconSize: 16
      },

      maglock: {
        label: "Maglock",
        symbol: "MAG",
        prefix: "MAG",
        iconImage: "icons/magLock.png",
        iconSize: 16
      },

      electricStrike: {
        label: "Electric Strike",
        symbol: "ES",
        prefix: "ES",
        iconImage: null,
        iconSize: 16
      },

      acp: {
        label: "Access Control Panel",
        symbol: "ACP",
        prefix: "ACP",
        iconImage: "icons/accessControlPanel.png",
        iconSize: 18
      },

      videoIntercomDoor: {
        label: "Video Intercom - Door",
        symbol: "VID",
        prefix: "VID",
        iconImage: "icons/int.png",
        iconSize: 16
      },

      videoIntercomMaster: {
        label: "Video Intercom - Master",
        symbol: "VIM",
        prefix: "VIM",
        iconImage: "icons/int.png",
        iconSize: 16
      }
    }
  }
};

/*
==================================================
STATE
==================================================
*/

let systems = structuredClone(defaultSystems);

let documents = [];

let currentDocIndex = 0;
let currentPageIndex = 0;

let currentSystem =
  Object.keys(systems)[0];

let currentItem =
  Object.keys(
    systems[currentSystem].items
  )[0];

let mode = "device";

let zoom = 1;

let globalIconScale = 1;

let selectedMarkerIndex = null;
let draggingMarkerIndex = null;

const LABEL_SIZE = 11;
const HIT_RADIUS = 16;

const iconCache = new Map();

/*
==================================================
ELEMENTS
==================================================
*/
const fovControls =
  document.getElementById("fovControls");

const rotateLeftBtn =
  document.getElementById("rotateLeftBtn");

const rotateRightBtn =
  document.getElementById("rotateRightBtn");
const markerInspector = document.getElementById("markerInspector");
const inspectorTitle = document.getElementById("inspectorTitle");
const inspectorNote = document.getElementById("inspectorNote");
const closeInspectorBtn = document.getElementById("closeInspectorBtn");
const saveInspectorBtn = document.getElementById("saveInspectorBtn");
const deleteInspectorBtn = document.getElementById("deleteInspectorBtn");
const canvas =
  document.getElementById("canvas");

const ctx =
  canvas.getContext("2d");

const canvasWrap =
  document.getElementById("canvasWrap");

const projectName =
  document.getElementById("projectName");

const projectNameError =
  document.getElementById(
    "projectNameError"
  );

const uploadedFileName =
  document.getElementById(
    "uploadedFileName"
  );

const upload =
  document.getElementById("upload");

const loadProjectInput =
  document.getElementById(
    "loadProjectInput"
  );

const systemSelect =
  document.getElementById(
    "systemSelect"
  );

const itemSelect =
  document.getElementById(
    "itemSelect"
  );
const pageInfo =
  document.getElementById("pageInfo");

const prevPageBtn =
  document.getElementById("prevPage");

const nextPageBtn =
  document.getElementById("nextPage");

const deviceModeBtn =
  document.getElementById(
    "deviceModeBtn"
  );

const noteModeBtn =
  document.getElementById(
    "noteModeBtn"
  );

const fovModeBtn =
  document.getElementById(
    "fovModeBtn"
  );

const modeInfo =
  document.getElementById("modeInfo");

const zoomInfo =
  document.getElementById("zoomInfo");

const notes =
  document.getElementById("notes");

const selectedInfo =
  document.getElementById(
    "selectedInfo"
  );

const selectedMarkerNote =
  document.getElementById(
    "selectedMarkerNote"
  );

const noteList =
  document.getElementById("noteList");

const counts =
  document.getElementById("counts");

const progressWrap =
  document.getElementById(
    "progressWrap"
  );

const progressBar =
  document.getElementById(
    "progressBar"
  );

const progressText =
  document.getElementById(
    "progressText"
  );

  const iconSizeSlider =
  document.getElementById("iconSizeSlider");

const iconSizeValue =
  document.getElementById("iconSizeValue");

/*
==================================================
MARKER INSPECTOR
==================================================
*/

function openMarkerInspector(marker) {
  if (!marker || !markerInspector) return;

  inspectorTitle.textContent =
    marker.label || "Selected Item";

  inspectorNote.value =
    marker.note || "";
  if (marker.kind === "fov") {
    fovControls.classList.remove("hidden");
  } else {
    fovControls.classList.add("hidden");
  }

  const point = canvasPointToViewportPoint(
    marker.x,
    marker.y
  );

  markerInspector.style.left =
    `${point.x + 18}px`;

  markerInspector.style.top =
    `${point.y + 18}px`;

  markerInspector.classList.remove("hidden");
  console.log("Opening inspector", marker);
}

function closeMarkerInspector() {
  if (!markerInspector) return;

  markerInspector.classList.add("hidden");
}

function saveMarkerInspector() {
  const marker = getSelectedMarker();

  if (!marker) return;

  marker.note = inspectorNote.value;
  markUnsaved();
  updateNoteList();
  updateSelectedInfo();

  draw();

  closeMarkerInspector();
}

function canvasPointToViewportPoint(x, y) {
  const canvasRect =
    canvas.getBoundingClientRect();

  const workspaceRect =
    document
    .getElementById("workspace")
    .getBoundingClientRect();

  return {
    x: canvasRect.left -
      workspaceRect.left +
      x * zoom,

    y: canvasRect.top -
      workspaceRect.top +
      y * zoom
  };
}

/*
==================================================
PLOTTING MODE
==================================================
*/

function hasOpenProject() {
  return documents.length > 0;
}

function updatePlottingMode() {
  const active = hasOpenProject();

  document.body.classList.toggle(
    "plotting-active",
    active
  );

  const saveBtn =
    document.getElementById(
      "saveJsonBtn"
    );

  const exportBtn =
    document.getElementById(
      "exportAllPdfBtn"
    );

  const undoBtn =
    document.getElementById(
      "undoBtn"
    );

  const clearBtn =
    document.getElementById(
      "clearBtn"
    );

  const deleteBtn =
    document.getElementById(
      "deleteBtn"
    );

  if (saveBtn) {
    saveBtn.disabled = !active;
  }

  if (exportBtn) {
    exportBtn.disabled = !active;
  }

  const page = getCurrentPage();

  const hasMarkers =
    page &&
    page.markers &&
    page.markers.length > 0;

  if (undoBtn) {
    undoBtn.disabled = !hasMarkers;
  }

  if (clearBtn) {
    clearBtn.disabled = !hasMarkers;
  }

  if (deleteBtn) {
    deleteBtn.disabled =
      selectedMarkerIndex === null;
  }
}
/*
==================================================
SAVE STATE
==================================================
*/
function markDrawingLoaded() {
  appState.hasLoadedDrawing = true;

  markUnsaved();
  updateValidationUI();
  updateSaveStateUI();
}

function markUnsaved() {
  appState.hasUnsavedChanges = true;
  updateSaveStateUI();
}

function markSaved() {
  appState.hasUnsavedChanges = false;
  appState.lastSavedAt = new Date();

  updateSaveStateUI();
}

/*
==================================================
INIT
==================================================
*/

function init() {
  populateSystems();

  bindEvents();

  updateProjectNameState();
  updateSaveStateUI();

  drawEmpty();

  updatePlottingMode();

  setMode("device");
}

/*
==================================================
EVENTS
==================================================
*/

function bindEvents() {
  upload.addEventListener(
    "change",
    handleUploads
  );

  projectName.addEventListener("input", () => {
    updateProjectNameState();
    updateProjectSummaryPanel();
    markUnsaved();
  });

  loadProjectInput.addEventListener(
    "change",
    loadProject
  );

  prevPageBtn.addEventListener(
    "click",
    prevPage
  );

  nextPageBtn.addEventListener(
    "click",
    nextPage
  );

  systemSelect.addEventListener(
    "change",
    onSystemChange
  );

  itemSelect.addEventListener(
    "change",
    onItemChange
  );

  deviceModeBtn.addEventListener(
    "click",
    () => setMode("device")
  );

  noteModeBtn.addEventListener(
    "click",
    () => setMode("note")
  );

  fovModeBtn.addEventListener(
    "click",
    () => setMode("fov")
  );

  document
    .getElementById("zoomOutBtn")
    .addEventListener(
      "click",
      zoomOut
    );

  document
    .getElementById("zoomInBtn")
    .addEventListener(
      "click",
      zoomIn
    );

  window.addEventListener(
    "beforeunload",
    event => {
      if (!appState.hasUnsavedChanges) return;

      event.preventDefault();
      event.returnValue = "";
    }
  );

  document
    .getElementById("resetZoomBtn")
    .addEventListener(
      "click",
      resetZoom
    );

  document
    .getElementById("undoBtn")
    .addEventListener(
      "click",
      undoLastMarker
    );

  document
    .getElementById("deleteBtn")
    .addEventListener(
      "click",
      deleteSelectedMarker
    );

  document
    .getElementById("clearBtn")
    .addEventListener(
      "click",
      clearMarkers
    );

  document
    .getElementById("notesBtn")
    .addEventListener(
      "click",
      toggleNotesPanel
    );

  document
    .getElementById("closeNotesBtn")
    .addEventListener(
      "click",
      closeNotesPanel
    );

  document
    .getElementById("saveJsonBtn")
    .addEventListener(
      "click",
      saveProject
    );

  document
    .getElementById("loadJsonBtn")
    .addEventListener(
      "click",
      () => loadProjectInput.click()
    );

  if (closeInspectorBtn) {
    closeInspectorBtn.addEventListener(
      "click",
      closeMarkerInspector
    );
  }

  if (saveInspectorBtn) {
    saveInspectorBtn.addEventListener(
      "click",
      saveMarkerInspector
    );
  }

  if (deleteInspectorBtn) {
    deleteInspectorBtn.addEventListener(
      "click",
      deleteSelectedMarker
    );
  }
if (iconSizeSlider) {
  iconSizeSlider.addEventListener(
    "input",
    () => {

      globalIconScale =
        Number(iconSizeSlider.value);

      if (iconSizeValue) {
        iconSizeValue.textContent =
          `${Math.round(
            globalIconScale * 100
          )}%`;
      }

      markUnsaved();

      draw();
    }
  );
}
  /*
  ==========================================
  GUARDED EXPORT BUTTONS
  ==========================================
  */

  const exportPngBtn =
    document.getElementById(
      "exportPngBtn"
    );

  const exportPdfBtn =
    document.getElementById(
      "exportPdfBtn"
    );

  const exportAllPdfBtn =
    document.getElementById(
      "exportAllPdfBtn"
    );

  const exportCountsBtn =
    document.getElementById(
      "exportCountsBtn"
    );

  if (exportPngBtn) {
    exportPngBtn.addEventListener(
      "click",
      exportCurrentPNG
    );
  }

  if (exportPdfBtn) {
    exportPdfBtn.addEventListener(
      "click",
      exportCurrentPDF
    );
  }

  if (exportAllPdfBtn) {
    exportAllPdfBtn.addEventListener(
      "click",
      exportAllPDF
    );
  }

  if (exportCountsBtn) {
    exportCountsBtn.addEventListener(
      "click",
      exportCountsCSV
    );
  }

  notes.addEventListener(
    "input",
    saveCurrentNotes
  );

  selectedMarkerNote.addEventListener(
    "input",
    saveSelectedMarkerNote
  );

  canvas.addEventListener(
    "mousedown",
    onCanvasMouseDown
  );

  canvas.addEventListener(
    "mousemove",
    onCanvasMouseMove
  );

  canvas.addEventListener(
    "mouseup",
    onCanvasMouseUp
  );

  canvas.addEventListener(
    "mouseleave",
    onCanvasMouseUp
  );

  canvas.addEventListener(
    "wheel",
    onCanvasWheel, {
      passive: false
    }
  );

  window.addEventListener(
    "keydown",
    onKeyDown
  );

  rotateLeftBtn.addEventListener(
    "click",
    () => rotateSelectedFov(-15)
  );

  rotateRightBtn.addEventListener(
    "click",
    () => rotateSelectedFov(15)
  );
}

/*
==================================================
HELPERS
==================================================
*/

function onCanvasMouseDown(event) {
  const { x, y } =
    getCanvasPoint(event);

  handleCanvasPress(x, y);
}
function pageHasReportContent(page) {
  if (!page) return false;

  const hasNotes = page.notes && page.notes.trim().length > 0;
  const hasMarkers = page.markers && page.markers.length > 0;

  return hasNotes || hasMarkers;
}

function getProjectTotals() {
  let totalPages = 0;
  let totalDevices = 0;
  let totalNotes = 0;
  let totalFov = 0;

  documents.forEach(documentItem => {
    documentItem.pages.forEach(page => {
      totalPages++;

      page.markers.forEach(marker => {
        if (marker.kind === "device") totalDevices++;
        if (marker.kind === "note") totalNotes++;
        if (marker.kind === "fov") totalFov++;
      });

      if (page.notes && page.notes.trim()) {
        totalNotes++;
      }
    });
  });

  return {
    totalPages,
    totalDevices,
    totalNotes,
    totalFov
  };
}

function confirmDiscardUnsavedChanges() {
  if (!appState.hasUnsavedChanges) return true;

  return confirm(
    "You have unsaved changes.\n\nContinue without saving?"
  );
}

function hasProjectName() {
  return appState.projectName.length > 0;
}

function hasLoadedDrawing() {
  return appState.hasLoadedDrawing && documents.length > 0;
}

function canSaveOrExport() {
  return hasProjectName() && hasLoadedDrawing();
}

function validateCanSaveOrExport() {
  updateProjectNameState();

  if (!hasProjectName()) {
    alert("Project Name Required\n\nPlease enter a project name before saving or exporting.");
    projectName.focus();
    return false;
  }

  if (!hasLoadedDrawing()) {
    alert("Drawing Required\n\nPlease upload a PDF or image before saving or exporting.");
    return false;
  }

  return true;
}

function getProjectName() {
  return projectName ?
    projectName.value.trim() :
    "";
}

function updateProjectNameState() {
  appState.projectName = getProjectName();
  updateValidationUI();
}

function markUnsaved() {
  appState.hasUnsavedChanges = true;
  updateSaveStateUI();
}

function markSaved() {
  appState.hasUnsavedChanges = false;
  appState.lastSavedAt = new Date();
  updateSaveStateUI();
}

function updateMarkerState() {
  appState.hasMarkers =
    documents.some(documentItem =>
      documentItem.pages.some(
        page =>
          page.markers &&
          page.markers.length > 0
      )
    );
}

function uid() {
  return (
    Math.random().toString(36).slice(2) +
    Date.now().toString(36)
  );
}

function cleanName(name) {
  return (name || "project")
    .replace(/\.[^/.]+$/, "")
    .replace(/[^a-z0-9-_ ]/gi, "")
    .trim()
    .replace(/\s+/g, "-") || "project";
}

function getProjectSafeName() {
  return cleanName(
    projectName.value || "marked-project"
  );
}

function validateProjectName() {
  if (!CONFIG.requireProjectName) return true;

  const val = projectName.value.trim();

  if (!val) {
    projectNameError.textContent =
      "Project name required.";
    projectName.focus();
    return false;
  }

  projectNameError.textContent = "";
  return true;
}

function getCurrentPage() {
  return documents.length ?
    documents[currentDocIndex]?.pages[currentPageIndex] || null :
    null;
}

function getCurrentItem() {
  return systems[currentSystem]?.items[currentItem] || null;
}

function getSystemColor(key) {
  return systems[key]?.color || "#000000";
}

function getMarkerSize(marker) {
  return (
    marker.iconSize ||
    systems[marker.system]?.items?. [marker.type]?.iconSize ||
    16
  ) * globalIconScale;
}

function isCurrentItemCamera() {
  return CONFIG.fov.enabledFor.includes(currentItem);
}

function imageFromData(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();

    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

/*
==================================================
UPLOADS
==================================================
*/

async function handleUploads(event) {
  const files = [...event.target.files || []];

  if (!files.length) return;

  if (!confirmDiscardUnsavedChanges()) {
    event.target.value = "";
    return;
  }

  documents = [];
  currentDocIndex = 0;
  currentPageIndex = 0;
  selectedMarkerIndex = null;

  uploadedFileName.textContent =
    files.map(file => file.name).join(", ");

  showProgress("Preparing upload...");

  for (const file of files) {
    if (file.name.toLowerCase().endsWith(".dwg")) {
      alert(`${file.name} is a DWG. Export it to PDF first.`);
      continue;
    }

    if (
      file.type === "application/pdf" ||
      file.name.toLowerCase().endsWith(".pdf")
    ) {
      await loadPDF(file);
    } else if (file.type.startsWith("image/")) {
      await loadImage(file);
    } else {
      alert(`${file.name} is not supported. Use PNG, JPG, or PDF.`);
    }
  }

  if (documents.length) {
    markDrawingLoaded();
  }

  hideProgress();
  setStatus("Drawing loaded.");
  draw();
}

function loadImage(file) {
  return new Promise(resolve => {
    showProgress(`Loading image: ${file.name}`);

    const reader = new FileReader();

    reader.onload = event => {
      const image = new Image();

      image.onload = () => {
        documents.push({
          id: uid(),
          name: file.name,
          type: "image",
          pages: [{
            imageData: event.target.result,
            image,
            renderedWidth: image.width,
            renderedHeight: image.height,
            markers: [],
            notes: ""
          }]
        });

        resolve();
      };

      image.onerror = () => {
        alert(`Could not load image: ${file.name}`);
        resolve();
      };

      image.src = event.target.result;
    };

    reader.readAsDataURL(file);
  });
}

function loadPDF(file) {
  return new Promise(resolve => {
    const reader = new FileReader();

    reader.onload = async event => {
      try {
        const pdfBytes =
          new Uint8Array(event.target.result);

        const pdf =
          await pdfjsLib.getDocument(pdfBytes).promise;

        const doc = {
          id: uid(),
          name: file.name,
          type: "pdf",
          pages: []
        };

        showProgress(`Loading ${file.name}...`);

        for (
          let pageNum = 1; pageNum <= pdf.numPages; pageNum++
        ) {
          updateProgress(
            pageNum,
            pdf.numPages,
            file.name
          );

          const page =
            await pdf.getPage(pageNum);

          const viewport =
            page.getViewport({
              scale: CONFIG.pdfRenderScale
            });

          const tempCanvas =
            document.createElement("canvas");

          const tempCtx =
            tempCanvas.getContext("2d");

          tempCanvas.width = viewport.width;
          tempCanvas.height = viewport.height;

          await page.render({
            canvasContext: tempCtx,
            viewport
          }).promise;

          const imageData =
            tempCanvas.toDataURL("image/png");

          const image =
            await imageFromData(imageData);

          doc.pages.push({
            imageData,
            image,
            renderedWidth: viewport.width,
            renderedHeight: viewport.height,
            pdfWidth: page.view[2],
            pdfHeight: page.view[3],
            markers: [],
            notes: ""
          });
        }

        documents.push(doc);
      } catch (err) {
        console.error(err);
        alert(`Could not load PDF: ${file.name}`);
      }

      resolve();
    };

    reader.readAsArrayBuffer(file);
  });
}

/*
==================================================
SYSTEM / DEVICE SELECTS
==================================================
*/

function populateSystems() {
  systemSelect.innerHTML = "";

  Object.keys(systems).forEach(key => {
    const option =
      document.createElement("option");

    option.value = key;
    option.textContent = systems[key].label;

    systemSelect.appendChild(option);
  });

  if (!systems[currentSystem]) {
    currentSystem = Object.keys(systems)[0];
  }

  systemSelect.value = currentSystem;

  populateItems();
}

function populateItems() {
  itemSelect.innerHTML = "";

  const items =
    systems[currentSystem]?.items || {};

  Object.keys(items).forEach(key => {
    const item = items[key];

    const option =
      document.createElement("option");

    option.value = key;
    option.textContent = item.label;

    itemSelect.appendChild(option);
  });

  if (!items[currentItem]) {
    currentItem = Object.keys(items)[0];
  }

  itemSelect.value = currentItem;

  updateFovVisibility();
}

function onSystemChange() {
  currentSystem = systemSelect.value;

  currentItem =
    Object.keys(
      systems[currentSystem].items
    )[0];

  populateItems();
}

function onItemChange() {
  currentItem = itemSelect.value;
  updateFovVisibility();
}

/*
==================================================
PAGES
==================================================
*/

function getFlatPages() {
  const pages = [];

  documents.forEach((doc, docIndex) => {
    doc.pages.forEach((page, pageIndex) => {
      pages.push({
        doc,
        page,
        docIndex,
        pageIndex
      });
    });
  });

  return pages;
}

function getFlatPagePosition() {
  const pages = getFlatPages();

  return pages.findIndex(page =>
    page.docIndex === currentDocIndex &&
    page.pageIndex === currentPageIndex
  );
}

function goToFlatPage(index) {
  const pages = getFlatPages();

  if (
    !pages.length ||
    index < 0 ||
    index >= pages.length
  ) {
    return;
  }

  saveCurrentNotes();

  currentDocIndex = pages[index].docIndex;
  currentPageIndex = pages[index].pageIndex;

  selectedMarkerIndex = null;

  draw();
}

function prevPage() {
  const position = getFlatPagePosition();

  if (position > 0) {
    goToFlatPage(position - 1);
  }
}

function nextPage() {
  const position = getFlatPagePosition();
  const pages = getFlatPages();

  if (position < pages.length - 1) {
    goToFlatPage(position + 1);
  }
}

function updatePageControls() {
  const pages = getFlatPages();
  const position = getFlatPagePosition();
  const current = pages[position];

  pageInfo.textContent = current ?
    `Page ${position + 1} of ${pages.length} • ${current.doc.name}` :
    "Page 0 of 0";

  prevPageBtn.disabled = !pages.length || position <= 0;

  nextPageBtn.disabled = !pages.length ||
    position >= pages.length - 1;

  notes.value = getCurrentPage()?.notes || "";
}

/*
==================================================
MODES / FOV
==================================================
*/

function setMode(newMode) {
  if (
    newMode === "fov" &&
    !isCurrentItemCamera()
  ) {
    newMode = "device";
  }

  mode = newMode;

  deviceModeBtn.classList.toggle(
    "primary",
    mode === "device"
  );

  noteModeBtn.classList.toggle(
    "primary",
    mode === "note"
  );

  fovModeBtn.classList.toggle(
    "primary",
    mode === "fov"
  );

  modeInfo.textContent =
    mode === "device" ?
    "Mode: Device" :
    mode === "note" ?
    "Mode: Note" :
    "Mode: FOV";

  updateFovVisibility();
}

function updateFovVisibility() {
  const show = isCurrentItemCamera();

  fovModeBtn.classList.toggle(
    "hidden",
    !show
  );

  if (!show && mode === "fov") {
    setMode("device");
  }
}

function syncFovControlsToSelected() {
  return;
}

function updateSelectedFovFromControls() {
  return;
}

function rotateSelectedFov(degrees) {
  const marker = getSelectedMarker();

  if (!marker) return;

  if (marker.kind === "fov") {
    marker.rotation =
      (
        (marker.rotation || 0) +
        degrees +
        360
      ) % 360;

    draw();
    openMarkerInspector(marker);

    return;
  }

  const page = getCurrentPage();

  if (!page) return;

  const linkedFov =
    page.markers.find(fov =>
      fov.kind === "fov" &&
      fov.linkedTo === marker.label
    );

  if (!linkedFov) return;

  linkedFov.rotation =
    (
      (linkedFov.rotation || 0) +
      degrees +
      360
    ) % 360;

  draw();
  openMarkerInspector(marker);
}

/*
==================================================
CANVAS INTERACTION
==================================================
*/

function getCanvasPoint(event) {
  const rect =
    canvas.getBoundingClientRect();

  return {
    x: (event.clientX - rect.left) *
      (canvas.width / rect.width),

    y: (event.clientY - rect.top) *
      (canvas.height / rect.height)
  };
}

function findMarkerAt(x, y) {
  const page = getCurrentPage();

  if (!page) return null;

  for (let i = page.markers.length - 1; i >= 0; i--) {
    const marker = page.markers[i];

    const distance = Math.hypot(
      marker.x - x,
      marker.y - y
    );

    // 360 FOV: allow clicking anywhere inside the circle
    if (
      marker.kind === "fov" &&
      marker.fovType === "circle"
    ) {
      const radius =
        marker.length || CONFIG.fov.size;

      if (distance <= radius) {
        return i;
      }

      continue;
    }

    // Directional FOV: selectable near center
    if (marker.kind === "fov") {
      if (distance <= 24) {
        return i;
      }

      continue;
    }

    // Normal markers
    if (distance <= HIT_RADIUS) {
      return i;
    }
  }

  return null;
}

function onCanvasMouseMove(event) {
  if (draggingMarkerIndex === null) return;

  const page = getCurrentPage();

  if (!page) return;

  const marker = page.markers[draggingMarkerIndex];

  if (!marker) {
    draggingMarkerIndex = null;
    return;
  }

  const { x, y } = getCanvasPoint(event);

  marker.x = x;
  marker.y = y;

  markUnsaved();
  draw();
}

function handleCanvasPress(x, y) {
  const page = getCurrentPage();
  const hit = findMarkerAt(x, y);

  if (hit !== null) {
    selectedMarkerIndex = hit;
    draggingMarkerIndex = hit;

    const marker = getSelectedMarker();

    draw();
    openMarkerInspector(marker);

    return;
  }

  if (mode === "note") {
    page.markers.push(
      createNoteMarker(x, y)
    );

    markUnsaved();

    selectedMarkerIndex =
      page.markers.length - 1;

    draw();
    openMarkerInspector(getSelectedMarker());

    return;
  }

  if (mode === "fov") {
    page.markers.push(
      createFovMarker(x, y)
    );

    markUnsaved();

    selectedMarkerIndex =
      page.markers.length - 1;

    draw();
    return;
  }

  page.markers.push(
    createDeviceMarker(x, y)
  );

  markUnsaved();

  selectedMarkerIndex =
    page.markers.length - 1;

  draw();
}

function onCanvasMouseMove(event) {
  if (draggingMarkerIndex === null) return;

  const page = getCurrentPage();

  if (!page) return;

  const {
    x,
    y
  } = getCanvasPoint(event);

  page.markers[draggingMarkerIndex].x = x;
  page.markers[draggingMarkerIndex].y = y;
  markUnsaved();
  draw();
}

function onCanvasMouseUp() {
  draggingMarkerIndex = null;
}

/*
==================================================
MARKER FACTORIES
==================================================
*/

function createDeviceMarker(x, y) {
  const item = getCurrentItem();

  return {
    kind: "device",
    x,
    y,
    system: currentSystem,
    type: currentItem,
    symbol: item.symbol,
    iconImage: item.iconImage || null,
    iconSize: item.iconSize || 16,
    color: systems[currentSystem]?.color ||
      "#000000",
    label: getNextLabel(
      item.prefix,
      getCurrentPage().markers
    ),
    itemLabel: item.label,
    prefix: item.prefix,
    note: ""
  };
}

function createNoteMarker(x, y) {
  return {
    kind: "note",
    x,
    y,
    system: "notes",
    type: "note",
    symbol: CONFIG.note.symbol,
    iconImage: null,
    iconSize: CONFIG.note.iconSize,
    color: CONFIG.note.color,
    label: getNextLabel(
      CONFIG.note.prefix,
      getCurrentPage().markers
    ),
    itemLabel: CONFIG.note.label,
    prefix: CONFIG.note.prefix,
    note: ""
  };
}

function createFovMarker(x, y) {
  const is360Camera =
    currentItem === "camera360";

  return {
    kind: "fov",
    x,
    y,

    fovType: is360Camera
      ? "circle"
      : CONFIG.fov.defaultType,

    rotation: 0,

    length: CONFIG.fov.size,

    opacity: CONFIG.fov.opacity,

    color: CONFIG.fov.color,

    label: is360Camera
      ? "360 FOV"
      : "FOV"
  };
}

function getNextLabel(prefix, markers) {
  const safePrefix = prefix || "ITEM";

  const count =
    markers.filter(marker =>
      marker.kind !== "fov" &&
      (
        marker.prefix === safePrefix ||
        (marker.label || "").startsWith(
          `${safePrefix}-`
        )
      )
    ).length + 1;

  return `${safePrefix}-${count}`;
}

/*
==================================================
DRAWING
==================================================
*/

function drawEmpty() {
  canvas.width = 800;
  canvas.height = 500;

  ctx.fillStyle = "white";
  ctx.fillRect(
    0,
    0,
    canvas.width,
    canvas.height
  );

  ctx.fillStyle = "#64748b";
  ctx.font = "18px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.fillText(
    "Upload drawings or PDFs to begin",
    canvas.width / 2,
    canvas.height / 2
  );

  updateCounts();
  updatePageControls();
  updateProjectSummaryPanel();
  updateZoom();
  updateSelectedInfo();
  updateNoteList();
  updatePlottingMode();
}

function draw() {
  const page = getCurrentPage();

  if (!page) {
    drawEmpty();
    return;
  }

  canvas.width = page.image.width;
  canvas.height = page.image.height;

  ctx.drawImage(page.image, 0, 0);

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  page.markers.forEach((marker, index) => {
    if (marker.kind === "fov") {
      drawFov(
        ctx,
        marker,
        index === selectedMarkerIndex
      );
    }
  });

  page.markers.forEach((marker, index) => {
    if (marker.kind !== "fov") {
      drawDeviceMarker(
        ctx,
        marker,
        index === selectedMarkerIndex
      );
    }
  });

  drawLegend(ctx, page);

  updateCounts();
  updatePageControls();
  updateProjectSummaryPanel();
  updateZoom();
  updateSelectedInfo();
  updateNoteList();
  updatePlottingMode();
}

function drawDeviceMarker(context, marker, selected) {
  const color =
    marker.color ||
    getSystemColor(marker.system);

  const size = getMarkerSize(marker);

  if (selected) {
    context.beginPath();

    context.arc(
      marker.x,
      marker.y,
      Math.max(13, size / 2 + 5),
      0,
      Math.PI * 2
    );

    context.fillStyle = color + "33";
    context.fill();

    context.strokeStyle = color;
    context.lineWidth = 1.5;
    context.stroke();
  }

  if (marker.iconImage) {
    const icon =
      getCachedIcon(marker.iconImage, draw);

    if (icon && icon.complete) {
      context.drawImage(
        icon,
        marker.x - size / 2,
        marker.y - size / 2,
        size,
        size
      );
    } else {
      drawInitialBadge(
        context,
        marker.symbol || "?",
        marker.x,
        marker.y,
        size,
        color
      );
    }
  } else {
    drawInitialBadge(
      context,
      marker.symbol || "?",
      marker.x,
      marker.y,
      size,
      color
    );
  }

  context.fillStyle = color;
  context.font = `${LABEL_SIZE}px Arial`;
  context.textAlign = "center";
  context.textBaseline = "middle";

  context.fillText(
    marker.label,
    marker.x,
    marker.y + size / 2 + 12
  );

  if (marker.note) {
    context.fillStyle = "#f59e0b";
    context.beginPath();

    context.arc(
      marker.x + size / 2 + 4,
      marker.y - size / 2 - 2,
      4,
      0,
      Math.PI * 2
    );

    context.fill();
  }
}

function drawInitialBadge(context, text, x, y, size, color) {
  const width =
    Math.max(
      size + 8,
      String(text).length * 7 + 8
    );

  const height = size;

  context.fillStyle =
    "rgba(255,255,255,.85)";

  context.strokeStyle = color;
  context.lineWidth = 1.2;

  context.beginPath();

  context.roundRect(
    x - width / 2,
    y - height / 2,
    width,
    height,
    4
  );

  context.fill();
  context.stroke();

  context.fillStyle = color;

  context.font =
    `bold ${Math.max(
      8,
      Math.round(size * 0.55)
    )}px Arial`;

  context.textAlign = "center";
  context.textBaseline = "middle";

  context.fillText(text, x, y + 0.5);
}

function drawFov(context, marker, selected) {
  const length =
    marker.length || CONFIG.fov.size;

  const color =
    marker.color || CONFIG.fov.color;

  const opacity =
    marker.opacity ?? CONFIG.fov.opacity;

  context.save();

  context.globalAlpha = opacity;
  context.strokeStyle = color;
  context.fillStyle = color;

  if (marker.fovType === "circle") {
  context.beginPath();

  context.arc(
    marker.x,
    marker.y,
    length,
    0,
    Math.PI * 2
  );

  // light fill inside 360 FOV
  context.globalAlpha = 0.12;
  context.fillStyle = color;
  context.fill();

  // stronger outline
  context.globalAlpha = opacity;
  context.strokeStyle = color;
  context.lineWidth = CONFIG.fov.lineWidth;
  context.stroke();
}else {
    const rotation =
      (marker.rotation || 0) *
      Math.PI /
      180;

    const arrowHead =
      CONFIG.fov.arrowHead;

    context.translate(marker.x, marker.y);
    context.rotate(rotation);

    context.lineWidth =
      CONFIG.fov.lineWidth;

    context.lineCap = "round";

    context.beginPath();
    context.moveTo(0, 0);
    context.lineTo(length, 0);
    context.stroke();

    context.beginPath();
    context.moveTo(length, 0);

    context.lineTo(
      length - arrowHead,
      -arrowHead * 0.65
    );

    context.lineTo(
      length - arrowHead,
      arrowHead * 0.65
    );

    context.closePath();
    context.fill();
  }

  context.restore();

  if (selected) {
    context.save();

    context.strokeStyle = "#1f6feb";
    context.lineWidth = 1.5;
    context.setLineDash([5, 4]);

    context.beginPath();

    context.arc(
      marker.x,
      marker.y,
      marker.fovType === "circle" ?
      length :
      14,
      0,
      Math.PI * 2
    );

    context.stroke();
    context.restore();
  }
}

function drawLegend(context, page) {
  const items = getLegendItems(page);

  if (!items.length) return;

  const pad = 10;
  const x = 16;
  const y = 16;
  const lineHeight = 26;
  const titleHeight = 28;
  const width = 300;

  const height =
    titleHeight +
    items.length * lineHeight +
    pad * 2;

  context.save();

  context.fillStyle =
    "rgba(255,255,255,.88)";

  context.strokeStyle =
    "rgba(15,23,42,.25)";

  context.lineWidth = 1;

  context.beginPath();

  context.roundRect(
    x,
    y,
    width,
    height,
    8
  );

  context.fill();
  context.stroke();

  context.fillStyle = "#111827";
  context.font = "bold 12px Arial";
  context.textAlign = "left";
  context.textBaseline = "middle";

  context.fillText(
    "Legend / Counts",
    x + pad,
    y + pad + 2
  );

  let currentY =
    y + pad + titleHeight;

  items.forEach(item => {
    drawInitialBadge(
      context,
      item.symbol,
      x + pad + 12,
      currentY,
      14,
      item.color
    );

    context.fillStyle = "#111827";
    context.font = "11px Arial";
    context.textAlign = "left";
    context.textBaseline = "middle";

    context.fillText(
      `${item.prefix} - ${item.label}: ${item.count}`,
      x + pad + 30,
      currentY
    );

    currentY += lineHeight;
  });

  context.restore();
}

/*
==================================================
ICON LOADING
==================================================
*/

function getCachedIcon(src, onReady) {
  if (!src) return null;

  if (iconCache.has(src)) {
    const image = iconCache.get(src);
    return image.complete ? image : null;
  }

  const image = new Image();

  iconCache.set(src, image);

  image.onload =
    () => onReady && onReady();

  image.src = src;

  return image.complete ? image : null;
}

async function getLoadedIcon(src) {
  if (!src) return null;

  if (iconCache.has(src)) {
    const image = iconCache.get(src);

    if (image.complete) {
      return image;
    }
  }

  const image = new Image();

  iconCache.set(src, image);

  await new Promise((resolve, reject) => {
    image.onload = resolve;
    image.onerror = reject;
    image.src = src;
  });

  return image;
}

/*
==================================================
COUNTS / NOTES
==================================================
*/

function getLegendItems(page) {
  if (!page) return [];

  const map = new Map();

  page.markers.forEach(marker => {
    if (marker.kind === "fov") return;

    let key;
    let label;
    let prefix;
    let symbol;
    let color;

    if (marker.kind === "note") {
      key = "notes|note";
      label = CONFIG.note.label;
      prefix = CONFIG.note.prefix;
      symbol = CONFIG.note.symbol;
      color = CONFIG.note.color;
    } else {
      key =
        `${marker.system}|${marker.type}`;

      const system =
        systems[marker.system];

      const item =
        system?.items?. [marker.type];

      label =
        item?.label ||
        marker.itemLabel ||
        marker.type;

      prefix =
        item?.prefix ||
        marker.prefix ||
        marker.label ||
        "";

      symbol =
        item?.symbol ||
        marker.symbol ||
        "?";

      color =
        marker.color ||
        system?.color ||
        "#000000";
    }

    if (!map.has(key)) {
      map.set(key, {
        label,
        prefix,
        symbol,
        color,
        count: 0
      });
    }

    map.get(key).count++;
  });

  return [...map.values()].sort(
    (a, b) =>
    a.prefix.localeCompare(b.prefix)
  );
}

function updateCounts() {
  const page = getCurrentPage();

  if (
    !page ||
    !page.markers.some(
      marker => marker.kind !== "fov"
    )
  ) {
    counts.innerHTML =
      "No items plotted yet.";
    return;
  }

  const grouped = {};

  page.markers.forEach(marker => {
    if (marker.kind === "fov") return;

    const systemName =
      marker.kind === "note" ?
      "Notes" :
      systems[marker.system]?.label ||
      marker.system;

    const typeName =
      marker.kind === "note" ?
      CONFIG.note.label :
      systems[marker.system]
      ?.items[marker.type]?.label ||
      marker.itemLabel ||
      marker.type;

    grouped[systemName] ??= {};

    grouped[systemName][typeName] =
      (grouped[systemName][typeName] || 0) + 1;
  });

  let html = "";

  Object.keys(grouped).forEach(systemName => {
    html += `<strong>${systemName}</strong><br>`;

    Object.keys(grouped[systemName]).forEach(
      typeName => {
        html +=
          `&nbsp;&nbsp;${typeName}: ` +
          `${grouped[systemName][typeName]}<br>`;
      }
    );
  });

  html +=
    `<br><strong>Total Devices:</strong> ` +
    page.markers.filter(
      marker => marker.kind === "device"
    ).length;

  html +=
    `<br><strong>Notes:</strong> ` +
    page.markers.filter(
      marker => marker.kind === "note"
    ).length;

  html +=
    `<br><strong>FOV:</strong> ` +
    page.markers.filter(
      marker => marker.kind === "fov"
    ).length;

  counts.innerHTML = html;
}

function updateNoteList() {
  const page = getCurrentPage();

  if (!page) {
    noteList.innerHTML =
      "No notes placed yet.";
    return;
  }

  const noteMarkers =
    page.markers
    .map((marker, index) => ({
      marker,
      index
    }))
    .filter(
      item => item.marker.kind === "note"
    );

  if (!noteMarkers.length) {
    noteList.innerHTML =
      "No notes placed yet.";
    return;
  }

  noteList.innerHTML = "";

  noteMarkers.forEach(({
    marker,
    index
  }) => {
    const button =
      document.createElement("button");

    button.type = "button";

    button.textContent =
      `${marker.label}: ` +
      `${
        marker.note
          ? marker.note.slice(0, 34)
          : "No note yet"
      }`;

    button.onclick = () => {
      selectedMarkerIndex = index;
      openNotesPanel();
      draw();
    };

    noteList.appendChild(button);
  });
}

function saveCurrentNotes() {
  const page = getCurrentPage();

  if (page) {
    page.notes = notes.value;
    markUnsaved();
  }
}

function saveSelectedMarkerNote() {
  const marker = getSelectedMarker();

  if (marker) {
    marker.note =
      selectedMarkerNote.value;

    updateNoteList();
    draw();
  }
}

function getSelectedMarker() {
  const page = getCurrentPage();

  if (
    !page ||
    selectedMarkerIndex === null
  ) {
    return null;
  }

  return page.markers[selectedMarkerIndex] || null;
}

function updateSelectedInfo() {
  const marker = getSelectedMarker();

  if (!marker) {
    selectedInfo.innerHTML =
      "No item selected.";

    selectedMarkerNote.value = "";
    selectedMarkerNote.disabled = true;

    return;
  }

  selectedMarkerNote.disabled = false;
  selectedMarkerNote.value =
    marker.note || "";

  if (marker.kind === "fov") {
    selectedInfo.innerHTML =
      `<strong>Selected:</strong> FOV ` +
      `${
        marker.fovType === "circle"
          ? "360 Circle"
          : "Directional"
      }<br>` +
      `Rotation: ${Math.round(
        marker.rotation || 0
      )}°<br>` +
      `Size: ${Math.round(
        marker.length || CONFIG.fov.size
      )}`;

    return;
  }

  if (marker.kind === "note") {
    selectedInfo.innerHTML =
      `<strong>Selected:</strong> ${marker.label}<br>` +
      `Note marker`;

    return;
  }

  const type =
    systems[marker.system]
    ?.items?. [marker.type]?.label ||
    marker.itemLabel ||
    marker.type;

  selectedInfo.innerHTML =
    `<strong>Selected:</strong> ${marker.label}<br>` +
    `${type}<br>` +
    `<span class="tiny">System: ${
      systems[marker.system]?.label ||
      marker.system
    }</span>`;
}

/*
==================================================
EDITING
==================================================
*/

function undoLastMarker() {
  const page = getCurrentPage();

  if (!page || !page.markers.length) return;

  page.markers.pop();
  selectedMarkerIndex = null;
  markUnsaved();
  draw();
}

function deleteSelectedMarker() {
  const page = getCurrentPage();

  if (!page || selectedMarkerIndex === null) return;

  page.markers.splice(selectedMarkerIndex, 1);
  selectedMarkerIndex = null;
  closeMarkerInspector();
  markUnsaved();
  setStatus("Marker deleted.");
  draw();
}

function clearMarkers() {
  const page = getCurrentPage();

  if (
    page &&
    page.markers.length &&
    confirm("Clear all markups on this page?")
  ) {
    page.markers = [];
    selectedMarkerIndex = null;
    markUnsaved();
    draw();
  }
}

function onKeyDown(event) {
  const active = document.activeElement;

  const typing =
    active && ["INPUT", "TEXTAREA", "SELECT"].includes(
      active.tagName
    );

  if (
    event.ctrlKey &&
    event.key.toLowerCase() === "z"
  ) {
    event.preventDefault();
    undoLastMarker();
  }

  if (
    !typing &&
    (event.key === "Delete" ||
      event.key === "Backspace")
  ) {
    deleteSelectedMarker();
  }
}

/*
==================================================
ZOOM
==================================================
*/

function zoomIn() {
  zoom = Math.min(3, zoom + 0.1);
  updateZoom();
}

function zoomOut() {
  zoom = Math.max(0.25, zoom - 0.1);
  updateZoom();
}

function resetZoom() {
  zoom = 1;
  updateZoom();
}

function updateZoom() {
  canvasWrap.style.transform =
    `scale(${zoom})`;

  zoomInfo.textContent =
    `Zoom: ${Math.round(zoom * 100)}%`;
}

function onCanvasWheel(event) {
  if (!event.ctrlKey) return;

  event.preventDefault();

  if (event.deltaY < 0) {
    zoomIn();
  } else {
    zoomOut();
  }
}

/*
==================================================
EXPORTS
==================================================
*/

async function exportCanvasForPage(
  page,
  includeLiveLegend = false
) {
  const exportCanvas =
    document.createElement("canvas");

  const exportCtx =
    exportCanvas.getContext("2d");

  exportCanvas.width = page.image.width;
  exportCanvas.height = page.image.height;

  exportCtx.fillStyle = "white";

  exportCtx.fillRect(
    0,
    0,
    exportCanvas.width,
    exportCanvas.height
  );

  exportCtx.drawImage(page.image, 0, 0);

  page.markers.forEach(marker => {
    if (marker.kind === "fov") {
      drawFov(exportCtx, marker, false);
    }
  });

  for (const marker of page.markers) {
    if (marker.kind !== "fov") {
      await drawDeviceMarkerForExport(
        exportCtx,
        marker
      );
    }
  }

  if (includeLiveLegend) {
    drawLegend(exportCtx, page);
  }

  return exportCanvas;
}

async function drawDeviceMarkerForExport(
  context,
  marker
) {
  const color =
    marker.color ||
    getSystemColor(marker.system);

  const size = getMarkerSize(marker);

  if (marker.iconImage) {
    try {
      const icon =
        await getLoadedIcon(marker.iconImage);

      context.drawImage(
        icon,
        marker.x - size / 2,
        marker.y - size / 2,
        size,
        size
      );
    } catch {
      drawInitialBadge(
        context,
        marker.symbol || "?",
        marker.x,
        marker.y,
        size,
        color
      );
    }
  } else {
    drawInitialBadge(
      context,
      marker.symbol || "?",
      marker.x,
      marker.y,
      size,
      color
    );
  }

  context.fillStyle = color;
  context.font = `${LABEL_SIZE}px Arial`;
  context.textAlign = "center";
  context.textBaseline = "middle";

  context.fillText(
    marker.label,
    marker.x,
    marker.y + size / 2 + 8
  );

  if (marker.note) {
    context.fillStyle = "#f59e0b";
    context.beginPath();

    context.arc(
      marker.x + size / 2 + 4,
      marker.y - size / 2 - 2,
      4,
      0,
      Math.PI * 2
    );

    context.fill();
  }
}

async function exportAllPDF() {
  if (!validateCanSaveOrExport()) return;

  saveCurrentNotes();

  if (!documents.length) {
    alert("Upload a file first.");
    return;
  }

  showProgress("Generating markup summary...");
  setStatus("Generating markup summary...");

  remindSaveJson();

  try {

    const firstPage =
      documents[0].pages[0];

    const pdf =
      new window.jspdf.jsPDF({
        orientation:
          firstPage.image.width >
          firstPage.image.height
            ? "landscape"
            : "portrait",

        unit: "pt",

        format: [
          firstPage.image.width,
          firstPage.image.height
        ]
      });

    let first = true;

    for (const documentItem of documents) {
      for (
        let i = 0;
        i < documentItem.pages.length;
        i++
      ) {
        await addPageToPdf(
          pdf,
          documentItem.pages[i],
          first
        );

        first = false;
      }
    }

    appendReportPages(pdf);

    pdf.save(
      `${getProjectSafeName()}-marked-pages.pdf`
    );

    hideProgress();

    setStatus("Markup summary exported.");

  } catch (err) {
    console.error(err);

    hideProgress();

    alert("Could not export PDF.");
  }
}

async function exportCurrentPNG() {
  if (!validateCanSaveOrExport()) return;

  saveCurrentNotes();

  const page = getCurrentPage();

  if (!page) {
    alert("Upload a file first.");
    return;
  }

  const exportCanvas =
    await exportCanvasForPage(page, true);

  const link =
    document.createElement("a");

  link.download =
    `${getProjectSafeName()}-page-${currentPageIndex + 1}.png`;

  link.href =
    exportCanvas.toDataURL("image/png");

  link.click();
}

async function exportCurrentPDF() {
  if (!validateCanSaveOrExport()) return;

  saveCurrentNotes();

  const page = getCurrentPage();

  if (!page) {
    alert("Upload a file first.");
    return;
  }

  showProgress("Generating markup summary...");
  setStatus("Generating markup summary...");

  try {
    const pdf =
      new window.jspdf.jsPDF({
        orientation:
          page.image.width > page.image.height
            ? "landscape"
            : "portrait",

        unit: "pt",

        format: [
          page.image.width,
          page.image.height
        ]
      });

    await addPageToPdf(pdf, page, true);

    appendReportPages(pdf);

    pdf.save(
      `${getProjectSafeName()}-page-${currentPageIndex + 1}.pdf`
    );

    hideProgress();

    setStatus("Markup summary exported.");
  } catch (err) {
    console.error(err);

    hideProgress();

    alert("Could not export PDF.");
  }
}

async function addPageToPdf(pdf, page, first) {
  if (!first) {
    pdf.addPage(
      [page.image.width, page.image.height],
      page.image.width > page.image.height ?
      "landscape" :
      "portrait"
    );
  }

  const exportCanvas =
    await exportCanvasForPage(page, true);

  const image =
    exportCanvas.toDataURL("image/png");

  pdf.addImage(
    image,
    "PNG",
    0,
    0,
    page.image.width,
    page.image.height
  );
}

/*
==================================================
APPENDED NOTES PAGE
==================================================
*/

function appendNotesPage(pdf) {
  const width = 792;
  const height = 612;

  pdf.addPage([width, height], "landscape");

  const margin = 36;
  let y = margin;

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(16);

  pdf.text(
    projectName.value || "Project Notes",
    margin,
    y
  );

  y += 24;

  pdf.setFontSize(11);
  pdf.setFont("helvetica", "normal");

  pdf.text(
    `Generated: ${new Date().toLocaleString()}`,
    margin,
    y
  );

  y += 28;

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(13);

  pdf.text(
    "Project Counts / Notes",
    margin,
    y
  );

  y += 20;

  const lines = buildProjectNotesLines();

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);

  lines.forEach(line => {
    if (y > height - margin) {
      pdf.addPage([width, height], "landscape");

      y = margin;

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);
    }

    pdf.text(line, margin, y);
    y += 14;
  });
}

function pageHasReportContent(page) {
  if (!page) return false;

  const hasPageNotes =
    page.notes &&
    page.notes.trim().length > 0;

  const hasMarkers =
    page.markers &&
    page.markers.length > 0;

  return hasPageNotes || hasMarkers;
}

function getProjectTotals() {
  let totalPages = 0;
  let totalDevices = 0;
  let totalNotes = 0;
  let totalFov = 0;

  documents.forEach(documentItem => {
    documentItem.pages.forEach(page => {
      totalPages++;

      page.markers.forEach(marker => {
        if (marker.kind === "device") {
          totalDevices++;
        }

        if (marker.kind === "note") {
          totalNotes++;
        }

        if (marker.kind === "fov") {
          totalFov++;
        }
      });

      if (page.notes && page.notes.trim()) {
        totalNotes++;
      }
    });
  });

  return {
    totalPages,
    totalDevices,
    totalNotes,
    totalFov
  };
}

function appendReportPages(pdf) {
  addReportCoverPage(pdf);

  documents.forEach(documentItem => {
    documentItem.pages.forEach((page, pageIndex) => {
      if (!pageHasReportContent(page)) return;

      addPageReport(
        pdf,
        documentItem,
        page,
        pageIndex
      );
    });
  });
}

function addReportCoverPage(pdf) {
  const width = 792;
  const height = 612;
  const margin = 48;

  const totals = getProjectTotals();

  pdf.addPage([width, height], "landscape");

  pdf.setFillColor(205, 232, 238);
  pdf.rect(0, 0, width, 86, "F");

  pdf.setTextColor(30, 41, 59);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(24);

  pdf.text("MISTY RAINFOREST", margin, 40);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(12);

  pdf.text("LOW VOLTAGE MARKUP SUMMARY", margin, 62);

  let y = 130;

  pdf.setTextColor(30, 41, 59);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(13);

  pdf.text("PROJECT SUMMARY", margin, y);

  y += 34;

  const drawingFiles =
    documents.map(doc => doc.name).join(", ") || "—";

  const summaryRows = [
    ["Project Name:", projectName.value.trim() || "—"],
    ["Prepared By:", "—"],
    ["Drawing File(s):", drawingFiles],
    ["Total Pages:", String(totals.totalPages)],
    ["Total Devices:", String(totals.totalDevices)],
    ["Total Notes:", String(totals.totalNotes)],
    ["Total FOV Markups:", String(totals.totalFov)]
  ];

  summaryRows.forEach(([label, value]) => {
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10.5);
    pdf.setTextColor(30, 41, 59);

    pdf.text(label, margin, y);

    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(51, 65, 85);

    const wrappedValue = pdf.splitTextToSize(
      value || "—",
      width - margin - 190
    );

    pdf.text(wrappedValue, margin + 145, y);

    y += Math.max(26, wrappedValue.length * 14);
  });

  addReportFooter(pdf, width, height);
}

function addPageReport(pdf, documentItem, page, pageIndex) {
  const width = 792;
  const height = 612;
  const margin = 48;
  let y = 42;

  pdf.addPage([width, height], "landscape");

  pdf.setTextColor(30, 41, 59);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(16);

  const pageTitle =
    `PAGE ${pageIndex + 1} — ${documentItem.name}`;
  const wrappedTitle = pdf.splitTextToSize(pageTitle, width - margin * 2);

  pdf.text(wrappedTitle, margin, y);

  y += wrappedTitle.length * 18 + 18;

  y = addSectionBar(pdf, "PAGE NOTES", margin, y, width);
  y += 20;

  const pageNotes =
    page.notes && page.notes.trim() ?
    page.notes.trim().split("\n") :
    [];

  if (pageNotes.length) {
    pageNotes.forEach(noteLine => {
      const cleanLine = noteLine.trim();
      if (!cleanLine) return;

      const wrapped = pdf.splitTextToSize(
        `• ${cleanLine}`,
        width - margin * 2
      );

      if (y + wrapped.length * 14 > height - 70) {
        addReportFooter(pdf, width, height);
        pdf.addPage([width, height], "landscape");
        y = 42;
      }

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);
      pdf.setTextColor(51, 65, 85);

      pdf.text(wrapped, margin, y);

      y += wrapped.length * 14 + 8;
    });
  } else {
    pdf.setFont("helvetica", "italic");
    pdf.setFontSize(10);
    pdf.setTextColor(100, 116, 139);

    pdf.text("No page notes entered.", margin, y);

    y += 24;
  }

  y += 18;

  y = addSectionBar(pdf, "DEVICE COUNTS", margin, y, width);
  y += 22;

  const groupedCounts = getGroupedCountsBySystem(page);

  if (!groupedCounts.length) {
    pdf.setFont("helvetica", "italic");
    pdf.setFontSize(10);
    pdf.setTextColor(100, 116, 139);

    pdf.text("No devices plotted on this page.", margin, y);

    y += 24;
  } else {
    groupedCounts.forEach(group => {
      if (y > height - 95) {
        addReportFooter(pdf, width, height);
        pdf.addPage([width, height], "landscape");
        y = 42;
      }

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(11);
      pdf.setTextColor(30, 41, 59);

      pdf.text(group.systemName.toUpperCase(), margin, y);

      y += 18;

      group.items.forEach(item => {
        const line = `${item.prefix} - ${item.label}: ${item.count}`;
        const wrapped = pdf.splitTextToSize(line, width - margin * 2);

        if (y + wrapped.length * 14 > height - 70) {
          addReportFooter(pdf, width, height);
          pdf.addPage([width, height], "landscape");
          y = 42;
        }

        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(10);
        pdf.setTextColor(51, 65, 85);

        pdf.text(wrapped, margin, y);

        y += wrapped.length * 14 + 4;
      });

      y += 16;
    });
  }

  addReportFooter(pdf, width, height);
}

function addEmptyReportPage(pdf) {
  const width = 792;
  const height = 612;
  const margin = 48;

  pdf.addPage([width, height], "landscape");

  pdf.setTextColor(30, 41, 59);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(16);

  pdf.text("NO PAGE MARKUPS FOUND", margin, 60);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  pdf.setTextColor(51, 65, 85);

  pdf.text(
    "No plotted devices, FOV markups, or page notes were found in this project.",
    margin,
    92
  );

  addReportFooter(pdf, width, height);
}

function addSectionBar(pdf, title, margin, y, width) {
  const barHeight = 24;

  pdf.setFillColor(40, 150, 165);
  pdf.rect(margin, y, width - margin * 2, barHeight, "F");

  pdf.setTextColor(255, 255, 255);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);

  pdf.text(title, margin + 10, y + 16);

  pdf.setTextColor(30, 41, 59);

  return y + barHeight;
}

function getGroupedCountsBySystem(page) {
  if (!page || !page.markers) return [];

  const systemMap = new Map();

  page.markers.forEach(marker => {
    if (marker.kind !== "device") return;

    const systemKey = marker.system || "unknown";

    const systemName =
      systems[systemKey]?.label ||
      marker.system ||
      "Other";

    const item = systems[marker.system]?.items?. [marker.type];

    const label =
      item?.label ||
      marker.itemLabel ||
      marker.type ||
      "Unknown Device";

    const prefix =
      item?.prefix ||
      marker.prefix ||
      marker.symbol ||
      "ITEM";

    const itemKey = `${prefix}|${label}`;

    if (!systemMap.has(systemKey)) {
      systemMap.set(systemKey, {
        systemName,
        items: new Map()
      });
    }

    const group = systemMap.get(systemKey);

    if (!group.items.has(itemKey)) {
      group.items.set(itemKey, {
        prefix,
        label,
        count: 0
      });
    }

    group.items.get(itemKey).count++;
  });

  return [...systemMap.values()].map(group => ({
    systemName: group.systemName,
    items: [...group.items.values()].sort((a, b) =>
      a.prefix.localeCompare(b.prefix)
    )
  }));
}

function addReportFooter(pdf, width, height) {
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(7.5);
  pdf.setTextColor(180, 30, 30);

  const footerText =
    "PDF exports are flat deliverables and cannot be edited later. Save and retain the JSON project file to continue editing this project in Misty Rainforest.";

  const wrapped = pdf.splitTextToSize(footerText, width - 72);

  pdf.text(wrapped, 36, height - 28);

  pdf.setTextColor(30, 41, 59);
}

function buildProjectNotesLines() {
  const lines = [];

  documents.forEach(documentItem => {
    lines.push(`Drawing: ${documentItem.name}`);

    documentItem.pages.forEach(
      (page, pageIndex) => {
        lines.push(`  Page ${pageIndex + 1}`);

        const legendItems =
          getLegendItems(page);

        if (legendItems.length) {
          lines.push("    Counts:");

          legendItems.forEach(item => {
            lines.push(
              `      ${item.prefix} - ${item.label}: ${item.count}`
            );
          });
        } else {
          lines.push("    Counts: none");
        }

        if (page.notes) {
          lines.push("    Page Notes:");

          page.notes
            .split("\n")
            .forEach(noteLine => {
              lines.push(`      ${noteLine}`);
            });
        }

        const markerNotes =
          page.markers.filter(
            marker => marker.note
          );

        if (markerNotes.length) {
          lines.push("    Marker Notes:");

          markerNotes.forEach(marker => {
            lines.push(
              `      ${marker.label}: ${marker.note}`
            );
          });
        }

        lines.push("");
      }
    );
  });

  return lines;
}

function remindSaveJson() {
  if (
    documents.length &&
    confirm(
      "Exporting creates a flat PDF. Save the JSON too so you can edit this project later?"
    )
  ) {
    saveProject();
  }
}

function exportCountsCSV() {
  if (!validateCanSaveOrExport()) return;

  saveCurrentNotes();

  const rows = [
    [
      "Project",
      "Drawing",
      "Page",
      "Kind",
      "System",
      "Device Type",
      "Label",
      "X",
      "Y",
      "Marker Note",
      "Page Notes"
    ]
  ];

  const project =
    projectName.value || "";

  documents.forEach(documentItem => {
    documentItem.pages.forEach(
      (page, pageIndex) => {
        page.markers.forEach(marker => {
          if (marker.kind === "fov") return;

          rows.push([
            project,
            documentItem.name,
            pageIndex + 1,
            marker.kind,
            marker.kind === "note" ?
            "Notes" :
            systems[marker.system]?.label ||
            marker.system,
            marker.kind === "note" ?
            CONFIG.note.label :
            systems[marker.system]
            ?.items[marker.type]?.label ||
            marker.itemLabel ||
            marker.type,
            marker.label,
            Math.round(marker.x),
            Math.round(marker.y),
            marker.note || "",
            page.notes || ""
          ]);
        });
      }
    );
  });

  const csv =
    rows
    .map(row =>
      row
      .map(value =>
        `"${String(value).replace(/"/g, '""')}"`
      )
      .join(",")
    )
    .join("\n");

  downloadText(
    csv,
    `${getProjectSafeName()}-counts.csv`,
    "text/csv"
  );
}

/*
==================================================
SAVE / LOAD JSON
==================================================
*/
function saveProject() {
  if (!validateCanSaveOrExport()) return;

  saveCurrentNotes();

  const project = {
    version: 6,
    projectName: projectName.value || "",
    systems,
    settings: {
      globalIconScale
    },
    documents: documents.map(documentItem => ({
      id: documentItem.id,
      name: documentItem.name,
      type: documentItem.type,
      pages: documentItem.pages.map(page => ({
        imageData: page.imageData,
        renderedWidth: page.renderedWidth ||
          page.image?.width,
        renderedHeight: page.renderedHeight ||
          page.image?.height,
        pdfWidth: page.pdfWidth || null,
        pdfHeight: page.pdfHeight || null,
        markers: page.markers,
        notes: page.notes || ""
      }))
    }))
  };

  downloadText(
    JSON.stringify(project, null, 2),
    `${getProjectSafeName()}-editable-project.json`,
    "application/json"
  );

  markSaved();
  setStatus("Project JSON saved.");
}

async function loadProject(event) {
  const file = event.target.files[0];

  if (!file) return;

  if (!confirmDiscardUnsavedChanges()) {
    event.target.value = "";
    return;
  }

  try {
    const project =
      JSON.parse(await file.text());

    projectName.value =
      project.projectName || "";

   if (project.settings?.globalIconScale) {
  globalIconScale =
    project.settings.globalIconScale;
}

if (iconSizeSlider) {
  iconSizeSlider.value =
    globalIconScale;
}

if (iconSizeValue) {
  iconSizeValue.textContent =
    `${Math.round(
      globalIconScale * 100
    )}%`;
}

if (iconSizeValue) {
  iconSizeValue.textContent =
    `${Math.round(
      globalIconScale * 100
    )}%`;
}
     {
      globalIconScale =
        project.settings.globalIconScale;
    }

    if (project.systems) {
      systems = project.systems;
    }

    documents = [];

    for (
      const documentItem of
        project.documents || []
    ) {
      const newDocument = {
        id: documentItem.id || uid(),
        name: documentItem.name,
        type: documentItem.type,
        pages: []
      };

      for (
        const page of
          documentItem.pages || []
      ) {
        const image =
          await imageFromData(
            page.imageData
          );

        newDocument.pages.push({
          imageData: page.imageData,
          image,
          renderedWidth: page.renderedWidth ||
            image.width,
          renderedHeight: page.renderedHeight ||
            image.height,
          pdfWidth: page.pdfWidth || null,
          pdfHeight: page.pdfHeight || null,
          markers: page.markers || [],
          notes: page.notes || ""
        });
      }

      documents.push(newDocument);
    }

    uploadedFileName.textContent =
      `Loaded project: ${file.name}`;

    currentDocIndex = 0;
    currentPageIndex = 0;
    selectedMarkerIndex = null;

    populateSystems();

    appState.hasLoadedDrawing = documents.length > 0;
    updateProjectNameState();
    updateMarkerState();

    draw();
    markSaved();
    updateValidationUI();

    setStatus("Project loaded successfully.");
  } catch (err) {
    console.error(err);
    alert("Could not load project JSON.");
  }

  event.target.value = "";
}

function downloadText(text, filename, type) {
  const blob =
    new Blob([text], {
      type
    });

  const url =
    URL.createObjectURL(blob);

  const link =
    document.createElement("a");

  link.href = url;
  link.download = filename;
  link.click();

  URL.revokeObjectURL(url);
}

/*
==================================================
PROGRESS
==================================================
*/

function showProgress(text = "Loading...") {
  progressWrap.style.display = "flex";

  progressBar.style.width = "0%";

  progressText.textContent = text;
}

function updateProgress(
  current,
  total,
  name = "PDF"
) {
  const percent =
    Math.round((current / total) * 100);

  progressBar.style.width =
    `${percent}%`;

  progressText.textContent =
    `Loading ${name}: page ${current} of ${total} — ${percent}%`;
}

function hideProgress() {
  progressWrap.style.display = "none";
}

/*
==================================================
PANEL
==================================================
*/

function toggleNotesPanel() {
  document.body.classList.toggle(
    "notes-open"
  );
}

function openNotesPanel() {
  document.body.classList.add(
    "notes-open"
  );
}

function closeNotesPanel() {
  document.body.classList.remove(
    "notes-open"
  );
}

/*
==================================================
CANVAS ROUNDRECT FALLBACK
==================================================
*/

if (
  !CanvasRenderingContext2D
  .prototype.roundRect
) {
  CanvasRenderingContext2D
    .prototype.roundRect =
    function (
      x,
      y,
      width,
      height,
      radius
    ) {
      if (width < 2 * radius) {
        radius = width / 2;
      }

      if (height < 2 * radius) {
        radius = height / 2;
      }

      this.beginPath();

      this.moveTo(x + radius, y);

      this.arcTo(
        x + width,
        y,
        x + width,
        y + height,
        radius
      );

      this.arcTo(
        x + width,
        y + height,
        x,
        y + height,
        radius
      );

      this.arcTo(
        x,
        y + height,
        x,
        y,
        radius
      );

      this.arcTo(
        x,
        y,
        x + width,
        y,
        radius
      );

      this.closePath();

      return this;
    };
}

function updateProjectSummaryPanel() {
  const panelProjectName = document.getElementById("panelProjectName");
  const panelDrawingName = document.getElementById("panelDrawingName");
  const panelPageInfo = document.getElementById("panelPageInfo");

  const pages = getFlatPages();
  const position = getFlatPagePosition();
  const current = pages[position];

  if (panelProjectName) {
    panelProjectName.textContent =
      projectName.value.trim() || "Current Project";
  }

  if (panelDrawingName) {
    panelDrawingName.textContent =
      current?.doc?.name || "No drawing loaded";
  }

  if (panelPageInfo) {
    panelPageInfo.textContent =
      current ? `Page ${position + 1} of ${pages.length}` : "Page 0 of 0";
  }
}

function updateValidationUI() {
  const hasName = hasProjectName();
  const hasDrawing = hasLoadedDrawing();
  const allowSaveExport = hasName && hasDrawing;

  projectName.classList.toggle(
    "project-name-required",
    !hasName
  );

  if (projectNameError) {
    projectNameError.textContent = hasName ?
      "" :
      "Project name required.";
  }

  const saveJsonBtn = document.getElementById("saveJsonBtn");
  const exportPngBtn = document.getElementById("exportPngBtn");
  const exportPdfBtn = document.getElementById("exportPdfBtn");
  const exportAllPdfBtn = document.getElementById("exportAllPdfBtn");
  const exportCountsBtn = document.getElementById("exportCountsBtn");

  [
    saveJsonBtn,
    exportPngBtn,
    exportPdfBtn,
    exportAllPdfBtn,
    exportCountsBtn
  ].forEach(btn => {
    if (btn) {
      btn.disabled = !allowSaveExport;
    }
  });
}

function updateSaveStateUI() {
  const indicator = document.getElementById("saveStateIndicator");
  if (!indicator) return;

  indicator.textContent = appState.hasUnsavedChanges ?
    "● Unsaved Changes" :
    "● Saved";
}
const projectNameInput = document.getElementById("projectNameInput");

if (projectNameInput) {
  projectNameInput.addEventListener("input", () => {
    updateProjectNameState();
    markUnsaved();
  });
}

function setStatus(message) {
  const status =
    document.getElementById("statusMessage");

  if (!status) return;

  status.textContent = message;
}
init();
