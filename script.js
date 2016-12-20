// function to css property of html element
HTMLElement.prototype.css = function (prop) {
    return window.getComputedStyle(this, null).getPropertyValue(prop);
}

// object handling all the app functions
var app = {
    //max width of the image to be shown
    maxWidth: 0.85 * window.innerWidth,
    //max height of the image to be shown
    maxHeight: 0.85 * window.innerHeight,
    //angle of rotation for the image
    angle: 0,
    // gets the first element with specific selector
    getel: function (selector) {
        return document.querySelector(selector)
    },
    // gets all element with specific selector
    getelAll: function (selector) {
        return document.querySelectorAll(selector)
    },
    //event on file selected
    filechosen: function (ev) {
        var src = URL.createObjectURL(ev.target.files[0])
        this.img = new Image()
        this.img.onload = this.imgonload.bind(this)
        this.img.src = src
    },
    // image selected on load
    imgonload: function () {
        var imgWidth = this.img.width,
            imgHeight = this.img.height,
            newWidth = imgWidth,
            newHeight = imgHeight

        // if width or height out of max range
        // image is resized keeping aspect ration same
        if (imgWidth > this.maxWidth) {
            newWidth = this.maxWidth
            newHeight = newWidth / imgWidth * imgHeight

            imgWidth = newWidth
            imgHeight = newHeight
        }

        if (imgHeight > this.maxHeight) {
            newHeight = this.maxHeight
            newWidth = newHeight / imgHeight * imgWidth
        }

        this.imgWidth = newWidth;
        this.imgHeight = newHeight;

        // x,y position to show the image centered
        this.cx = (this.canvas.width - this.imgWidth) / 2
        this.cy = (this.canvas.height - this.imgHeight) / 2

        //initalizing angle and showing image
        this.angle = 0
        this.showImage.call(this)

        //on image load show controls and crop div
        this.initControls.call(this)
    },
    showImage: function () {
        //clear the canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)

        //translating to middle of image to rotate by angle
        var tx = this.cx + (this.imgWidth / 2),
            ty = this.cy + (this.imgHeight / 2);

        //save context for rotation
        this.ctx.save()

        //translate to middle of image
        this.ctx.translate(tx, ty)
            //rotate context by radian of degree angle
        this.ctx.rotate(this.torad(this.angle))
            //translate back
        this.ctx.translate(-tx, -ty)
            //draw the image
        this.ctx.drawImage(this.img, this.cx, this.cy, this.imgWidth, this.imgHeight)
            //restore canvas after transformation
        this.ctx.restore()
    },
    //function change degree to radian
    torad: function (deg) {
        return deg * Math.PI / 180;
    },
    //function called on image crop
    crop: function () {
        // getting crop region
        var x = this.offsetW,
            y = this.offsetN,
            width = this.canvas.width - this.offsetW - this.offsetE,
            height = this.canvas.height - this.offsetN - this.offsetS

        // getting image data of cropped area
        var data = this.ctx.getImageData(x, y, width, height);

        //setting up temporary canvas for image data url
        var canvas = document.createElement("canvas");
        canvas.width = width
        canvas.height = height
        canvas.getContext('2d').putImageData(data, 0, 0)

        //getting data url and replacing with current img src
        var dataurl = canvas.toDataURL()
        this.img.onload = null
        this.img.src = dataurl
        this.cx = x
        this.cy = y
        this.imgWidth = width
        this.imgHeight = height

        // showing the cropped image
        this.setRotate.call(this, 0)
        this.showImage()
    },
    // function to set rotate angle of image
    setRotate: function (angle) {
        this.angle = angle
        this.controlRotate.value = angle
        this.rotateValue.innerHTML = this.angle + "°"
        this.showImage()
    },
    // event called on rotate input changed by user
    rotateInput: function (ev) {
        this.setRotate.call(this, this.controlRotate.value)
    },

    //init function for controls
    initControls: function () {
        this.controls = this.getel("#controls")

        this.controlCrop = this.getel("#control-crop")
        this.controlCrop.onclick = this.crop.bind(this)

        this.controlRotate = this.getel("#control-rotate")
        this.rotateValue = this.getel("#rotate-value")
        this.controlRotate.oninput = this.rotateInput.bind(this)
        this.controlRotate.onchange = this.rotateInput.bind(this)
        this.setRotate.call(this, 0)

        this.controls.classList.add("show")

        //init crop div
        this.initCropDiv.call(this)
    },
    // the very first function called which inits all app controls
    init: function () {

        //init canvas
        this.canvas = this.getel("#canvas")
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.ctx = this.canvas.getContext('2d')

        //init filechooser
        this.filechooser = this.getel("#filechooser")
        this.filechooser.onchange = this.filechosen.bind(this)
    },

    //boolean to indicate crop div move
    move: false,
    //reference X value when dragged for resized
    dragX: 0,
    //reference Y value when dragged for resized
    dragY: 0,
    // resize booleans to indicate which direction to resize
    resizeN: false,
    resizeE: false,
    resizeW: false,
    resizeS: false,
    resize: false,
    //init function of cropdiv
    initCropDiv: function () {
        //init cropdiv
        this.cropdiv = document.querySelector("#crop-div")

        //init cropdiv position with the image loaded
        this.cropdiv.style.left = this.cx + "px"
        this.cropdiv.style.top = this.cy + "px"
        this.cropdiv.style.bottom = (this.canvas.height - (this.cy + this.imgHeight)) + "px"
        this.cropdiv.style.right = (this.canvas.width - (this.cx + this.imgWidth)) + "px"

        //event called when user wants to MOVE crop div
        this.cropdiv.onmousedown = function (ev) {
            ev.preventDefault()
            ev.stopPropagation()
            this.move = true
            this.northMD.call(this, ev)
            this.southMD.call(this, ev)
            this.eastMD.call(this, ev)
            this.westMD.call(this, ev)
        }.bind(this)

        // init-ing resize offset values
        this.dn = 0
        this.dw = 0
        this.de = 0
        this.ds = 0
        this.offsetN = parseInt(this.cropdiv.css("top").slice(0, -2))
        this.offsetW = parseInt(this.cropdiv.css("left").slice(0, -2))
        this.offsetE = parseInt(this.cropdiv.css("right").slice(0, -2))
        this.offsetS = parseInt(this.cropdiv.css("bottom").slice(0, -2))

        // getting corner spans for resize events
        var corners = this.getelAll(".corner")
        this.corner = {
                nw: corners[0],
                ne: corners[1],
                sw: corners[2],
                se: corners[3]
            }
            // init events on corner mouse down
        this.corner.nw.onmousedown = function (ev) {
            this.northMD.call(this, ev)
            this.westMD.call(this, ev)
        }.bind(this)
        this.corner.ne.onmousedown = function (ev) {
            this.northMD.call(this, ev)
            this.eastMD.call(this, ev)
        }.bind(this)
        this.corner.sw.onmousedown = function (ev) {
            this.southMD.call(this, ev)
            this.westMD.call(this, ev)
        }.bind(this)
        this.corner.se.onmousedown = function (ev) {
            this.southMD.call(this, ev)
            this.eastMD.call(this, ev)
        }.bind(this)

        //getting border spans for resize events
        var borders = this.getelAll(".border")
        this.border = {
            left: borders[0],
            top: borders[1],
            right: borders[2],
            bottom: borders[3]
        }

        this.border.left.onmousedown = this.westMD.bind(this)
        this.border.right.onmousedown = this.eastMD.bind(this)
        this.border.top.onmousedown = this.northMD.bind(this)
        this.border.bottom.onmousedown = this.southMD.bind(this)

        //init ondrag resizing event
        document.onmousemove = this.dragging.bind(this)
            //stop resizing on mouseup
        document.onmouseup = function () {
            this.move = this.resize = false
            this.resizeN = this.resizeS = this.resizeW = this.resizeE = false

            this.offsetE += this.de
            this.offsetN += this.dn
            this.offsetS += this.ds
            this.offsetW += this.dw

            this.de = this.dn = this.ds = this.dw = 0
        }.bind(this)

        //show crop div on screen
        this.cropdiv.classList.add("show")
    },
    //function to stop bubbling up events on mouse down
    MDinit: function (ev) {
        ev.stopPropagation()
        ev.preventDefault()
    },
    //west mouse down
    westMD: function (ev) {
        this.MDinit(ev)
        this.resize = this.resizeW = true
        this.dragX = ev.clientX
    },
    //east mouse down
    eastMD: function (ev) {
        this.MDinit(ev)
        this.resize = this.resizeE = true
        this.dragX = ev.clientX
    },
    //north mouse down
    northMD: function (ev) {
        this.MDinit(ev)
        this.resize = this.resizeN = true
        this.dragY = ev.clientY
    },
    //south mouse down 
    southMD: function (ev) {
        this.MDinit(ev)
        this.resize = this.resizeS = true
        this.dragY = ev.clientY
    },
    //event on mouse move over document
    dragging: function (ev) {
        // if not resizing return
        if (!this.resize) return;

        //calculate offset according to corressponding resize booleans
        if (this.resizeW)
            this.dw = ev.clientX - this.dragX
        if (this.resizeE)
            this.de = this.dragX - ev.clientX
        if (this.resizeN)
            this.dn = ev.clientY - this.dragY
        if (this.resizeS)
            this.ds = this.dragY - ev.clientY

        //change position of crop div
        this.cropdiv.style.left = this.offsetW + this.dw + "px"
        this.cropdiv.style.right = this.offsetE + this.de + "px"
        this.cropdiv.style.top = this.offsetN + this.dn + "px"
        this.cropdiv.style.bottom = this.offsetS + this.ds + "px"
    }
};

//initializing the app
app.init.call(app);