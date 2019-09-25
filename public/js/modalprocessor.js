$("#close-link").click(function() {
		// If the user checks the checkbox, it means he or she doesn't need to see the modal again
		// In that case, store a cookie inside the browser indicating that the user doesn't need to see the modal again
		var checked = $("#displaymodal").is(":checked");

		if (checked) {
			document.cookie = "seemodal=false";
		} else {
			document.cookie = "seemodal=true";
		}

		// Close the modal
		$("#intro-modal").css("display", "none");

		// Remove the cover layer
		$("#cover-layer").css("display", "none");
	});
if (document.cookie.split("=")[1] == "false") {
	$("#intro-modal").css("display", "none");
	// Remove the cover layer
	$("#cover-layer").css("display", "none");
}