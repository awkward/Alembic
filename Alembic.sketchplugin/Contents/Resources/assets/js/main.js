function toHex(rgb) {
  return "#" + ("0" + parseInt(rgb[0], 10).toString(16)).slice(-2) + ("0" + parseInt(rgb[1], 10).toString(16)).slice(-2) + ("0" + parseInt(rgb[2], 10).toString(16)).slice(-2);
}

function lerp(value, fromLow, fromHigh, toLow, toHigh) {
  return toLow + (((value - fromLow) / (fromHigh - fromLow)) * (toHigh - toLow))
}

function toSecondaryColor(rgb) {
  var brightness = (rgb[0] * 299 + rgb[1] * 587 + rgb[2] * 114) / 1000;
  var difference = (brightness < 128) ? lerp(brightness, 10, 128, 160, 100) : lerp(brightness, 128, 246, -100, -160);

  for (var i = 0; i < rgb.length; i++) {
    rgb[i] += difference;
    rgb[i] = rgb[i] < 0 ? 0 : rgb[i] > 255 ? 255 : rgb[i] | 0;
  }

  return rgb;
}

function emptyState() {
  document.querySelector(".emptyContainer").classList.remove("hidden");
  document.querySelector(".imagePreview").classList.add("hidden");
  document.querySelector(".colorPalette").classList.add("hidden");

  var colors = document.querySelectorAll(".colorPalette__color");
  for (var i = 0; i < colors.length; i++) {
    colors[i].style.backgroundColor = "transparent";
  }
}

function update(base64) {
  var colorThief = new ColorThief();
  var img = document.createElement("img");
  img.src = base64;
  img.className = "hiddenImage";

  document.querySelector(".emptyContainer").classList.add("hidden");
  document.querySelector(".imagePreview").classList.remove("hidden");
  document.querySelector(".imagePreview").style.backgroundImage = "url(" + base64 + ")";
  document.querySelector(".colorPalette").classList.remove("hidden");

  img.addEventListener("load", function(e) {
    var palette = colorThief.getPalette(img, 6);
    palette.forEach(function(color, i) {
      var li = document.querySelector(".colorPalette__color:nth-of-type(" + (i + 1) + ")");
      li.style.backgroundColor = toHex(color);
      li.setAttribute("data-color", toHex(color));

      var secondaryColor = toSecondaryColor(color);
      li.querySelector("svg path").setAttribute("fill", toHex(secondaryColor));
    });
    document.body.removeChild(img);
  });

  document.body.appendChild(img);
}

document.addEventListener("DOMContentLoaded", function() {
  var colors = document.querySelectorAll(".colorPalette__color");
  var toastTimeout;

  for (var i = 0; i < colors.length; i++) {
    colors[i].addEventListener("click", function() {
      var color = this.getAttribute("data-color");
      var input = document.createElement("input");
      input.value = color;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      document.querySelector(".imagePreview__toast span").style.backgroundColor = color;
      document.querySelector(".imagePreview__toast").classList.remove("hidden");
      if (toastTimeout) clearTimeout(toastTimeout);
      toastTimeout = setTimeout(function () {
        document.querySelector(".imagePreview__toast").classList.add("hidden");
      }, 1000);
    });
  }
});

document.addEventListener("contextmenu", function(e) {
  e.preventDefault();
});
