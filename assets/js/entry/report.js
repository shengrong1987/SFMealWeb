import '../../styles/importer.scss';
$(document).ready(function(){
  $(".copyBtn").click(function(){
    var indexes = ["0","A","B","C","D","E","F","G","H","I","J","K","L","M","N"];
    var pickupIndex = $(this).data("index");
    var pickupTitle = $(this).data("title");
    var pickupFromTime = $(this).data("from");
    var pickupTillTime = $(this).data("to");
    var method = $(this).data("method");
    var location = $(this).data("location");
//      var pickupInfos = $("[data-option='" + pickupIndex + "'][data-from='" + pickupFromTime + "'][data-to='" + pickupTillTime + "']");
    var pickupInfos = $("[data-method='" + method + "'][data-location='" + location + "'][data-from='" + pickupFromTime + "'][data-to='" + pickupTillTime + "']");
    var text = pickupTitle;
    var pickupIndexTitle = indexes[pickupIndex];
    pickupInfos.each(function(index){
      var infoRows = $(this).find("td");
      if(infoRows.length){
        var phone = infoRows[3].innerText.replace(/\D/g, "");
        var content = "送餐序号:" + pickupIndexTitle + index + "; " + infoRows[0].innerText + " : " + infoRows[2].innerText + "(" + infoRows[8].innerText + ") ; " + infoRows[4].innerText + " ; （" + phone + "） ; 应收: " + infoRows[6].innerText + "; 支付方式: " + infoRows[5].innerText + "； 已付:" + infoRows[7].innerText;
        text += "\n\n" + content + "\n";
      }
    });
    console.log(text);
    copyToClipboard(text);
  })

  $(".dbClick").dblclick(function(){
    var copyText = $(this).data("copy-text");
    copyToClipboard(copyText);
  })

  function copyToClipboard(text) {
    if (window.clipboardData && window.clipboardData.setData) {
      // IE specific code path to prevent textarea being shown while dialog is visible.
      return clipboardData.setData("Text", text);

    } else if (document.queryCommandSupported && document.queryCommandSupported("copy")) {
      var textarea = document.createElement("textarea");
      textarea.textContent = text;
      textarea.style.position = "fixed";  // Prevent scrolling to bottom of page in MS Edge.
      document.body.appendChild(textarea);
      textarea.select();
      try {
        return document.execCommand("copy");  // Security exception may be thrown by some browsers.
      } catch (ex) {
        console.warn("Copy to clipboard failed.", ex);
        return false;
      } finally {
        document.body.removeChild(textarea);
      }
    }
  }
})
