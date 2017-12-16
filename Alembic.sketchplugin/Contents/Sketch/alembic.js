@import "MochaJSDelegate.js";

function changePanelHeight(panel, height) {
  var frame = panel.frame();
  var previousHeight = frame.size.height;
  if (height == previousHeight) return;

  frame.origin.y += previousHeight - height;
  frame.size.height = height;
  panel.setFrame_display_animate(frame, true, true);
}

function expandPanel(panel) {
  changePanelHeight(panel, 196);
}

function minimizePanel(panel) {
  changePanelHeight(panel, 148);
}

function extractBase64FromSelection(selection) {
  if (selection.count() < 1 || selection.count() > 1) return undefined;

  var currentLayer = selection[0];
  if (currentLayer.class() == "MSBitmapLayer") {
    var data = currentLayer.image().data();
    return "data:image/png;base64," + data.base64EncodedStringWithOptions(null);
  } else {
    var fills = currentLayer.style().fills().reverse();
    var fill = fills.find(function(e) {
      return e.image()
    });

    if (fill) {
      var data = fill.image().data();
      return "data:image/png;base64," + data.base64EncodedStringWithOptions(null);
    } else return undefined;
  }
}

function onRun(context) {
  var threadDictionary = NSThread.mainThread().threadDictionary();
  var identifier = "co.awkward.alembic";
  if (threadDictionary[identifier]) return;

  var webView = WebView.alloc().initWithFrame(NSMakeRect(0, 0, 294, 126));
  var windowObject = webView.windowScriptObject();

  var selection = context.selection;
  var base64 = extractBase64FromSelection(selection);

  COScript.currentCOScript().setShouldKeepAround_(true);

  var panel = NSPanel.alloc().init();
  panel.setFrame_display(NSMakeRect(0, 0, 294, 170), true);
  panel.setStyleMask(NSTexturedBackgroundWindowMask | NSTitledWindowMask | NSClosableWindowMask | NSFullSizeContentViewWindowMask);
  panel.setBackgroundColor(NSColor.whiteColor());
  panel.setLevel(NSFloatingWindowLevel);
  panel.title = "Alembic";
  panel.titlebarAppearsTransparent = true;
  panel.makeKeyAndOrderFront(null);
  panel.standardWindowButton(NSWindowMiniaturizeButton).setHidden(true);
  panel.standardWindowButton(NSWindowZoomButton).setHidden(true);
  panel.center()
  threadDictionary[identifier] = panel;

  var vibrancy = NSVisualEffectView.alloc().initWithFrame(NSMakeRect(0, 0, 294, 170));
  vibrancy.setAppearance(NSAppearance.appearanceNamed(NSAppearanceNameVibrantLight));
  vibrancy.setBlendingMode(NSVisualEffectBlendingModeBehindWindow);
  vibrancy.autoresizingMask = NSViewHeightSizable;

  var delegate = new MochaJSDelegate({
    "webView:didFinishLoadForFrame:": (function(webView, webFrame) {
      if (base64 == undefined) {
        windowObject.evaluateWebScript("emptyState()");
      } else {
        expandPanel(panel);
        windowObject.evaluateWebScript("update('" + base64 + "')");
      }
    }),
    "webView:didChangeLocationWithinPageForFrame:": (function(webView, webFrame) {
      var hash = windowObject.evaluateWebScript("window.location.hash.substring(1)");
      var data = JSON.parse(hash);

      if (data.type == "clipboard") {
        var clipboard = NSPasteboard.generalPasteboard();
        clipboard.clearContents();
        clipboard.setString_forType_(data.color, NSStringPboardType);
      } else if (data.type == "document") {
        var documentAssets = context.document.documentData().assets();
        documentAssets.addColor(MSImmutableColor.colorWithSVGString(data.color).newMutableCounterpart());
        NSApp.delegate().refreshCurrentDocument();
      }
    })
  })

  webView.setFrameLoadDelegate_(delegate.getClassInstance());

  webView.setDrawsBackground(false);
  var request = NSURLRequest.requestWithURL(context.plugin.urlForResourceNamed("alembic.html"));
  webView.autoresizingMask = NSViewHeightSizable;
  webView.mainFrame().loadRequest(request);

  panel.contentView().addSubview(vibrancy);
  panel.contentView().addSubview(webView);

  var closeButton = panel.standardWindowButton(NSWindowCloseButton);
  closeButton.setCOSJSTargetFunction(function(sender) {
    panel.close();
    threadDictionary.removeObjectForKey(identifier);
    COScript.currentCOScript().setShouldKeepAround_(false);
  });
}

var onSelectionChanged = function(context) {
  // BUG: newSelection is empty when changing selection
  // WORKAROUND: document.selectedLayers().layers()
  // http://sketchplugins.com/d/112-bug-selectionchanged-finish-newselection-is-empty

  var threadDictionary = NSThread.mainThread().threadDictionary();
  var identifier = "co.awkward.alembic";

  if (threadDictionary[identifier]) {
    var selection = context.actionContext.document.selectedLayers().layers();
    var base64 = extractBase64FromSelection(selection);
    var panel = threadDictionary[identifier];

    var webView = panel.contentView().subviews()[1];
    var windowObject = webView.windowScriptObject();

    expandPanel(panel);
    windowObject.evaluateWebScript(base64 == undefined ? null : "update('" + base64 + "')");
  }
};
