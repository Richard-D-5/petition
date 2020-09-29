(function () {
    const canvas = document.querySelector("#canvas");
    const ctx = canvas.getContext("2d");
    const submit = document.querySelector("#submit-button");
    const addImg = document.querySelector("#add-Img");
    const haveSigned = document.querySelector("#haveSigned");
    const clearCanvas = document.querySelector("#clear-button");

    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.lineWidth = 4;
    ctx.strokeStyle = "black";

    let isDrawing = false;
    let lastX = 0;
    let lastY = 0;

    function draw(e) {
        if (!isDrawing) return;
        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(e.offsetX, e.offsetY);
        ctx.stroke();
        [lastX, lastY] = [e.offsetX, e.offsetY];
    }

    canvas.addEventListener("mousedown", (e) => {
        isDrawing = true;
        [lastX, lastY] = [e.offsetX, e.offsetY];
    });

    canvas.addEventListener("mousemove", draw);
    canvas.addEventListener("mouseup", () => (isDrawing = false));
    canvas.addEventListener("mouseout", () => (isDrawing = false));

    const dataURL = () => {
        let data = canvas.toDataURL();
        addImg.value = data;
        haveSigned.value = "haveSigned";
        console.log("dataURL: ", dataURL);
    };

    const clear = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        addImg.value = "hidden";
    };

    submit.addEventListener("mousedown", dataURL);
    clearCanvas.addEventListener("mousedown", clear);
})();
