const canvas = document.querySelector('#canvas')
const ctx = canvas.getContext('2d')
const resumeBtn = document.querySelector("#resumeBtn")
const player = document.querySelector('audio#audioPlayer')
const addFilebtn = document.querySelector('#addFilebtn')
const fileInput = document.querySelector('#fileInput')
let audioSrc = new Audio()
let audioCtx = null
const AUTO_RESUME = false

resize();
drawText();

audioSrc.addEventListener('canplay', e => {
    player.replaceWith(audioSrc)
    audioSrc.controls = true
})

// drag events
window.addEventListener('dragover', e => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (!file) return

    if (audioSrc.canPlayType(file.type)) {
        document.body.classList.add('dragover')
    }
})

window.addEventListener('drop', e => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (!file) return
    localStorage.removeItem('audio')
    document.body.classList.remove('dragover')
    fileHandler(file, true)
})

window.addEventListener('dragend', e => {
    e.preventDefault()
    document.body.classList = ''
})


window.addEventListener('load', e => {
    const savedData = localStorage.getItem('audio')
    if (savedData) {
        if (AUTO_RESUME) {
            return resumeAudio(savedData)
        }
        resumeBtn.classList.add('show')
        resumeBtn.addEventListener('click', e => {
            resumeAudio(savedData)
        })
    }
})

window.addEventListener('resize', e => {
    resize();
})

function resumeAudio(savedData) {
    audioSrc.src = savedData
    const currentTime = JSON.parse(localStorage.getItem('audio_time'))?.currentTime
    if (currentTime) {
        audioSrc.currentTime = Number(currentTime)
    }
    audioSrc.loop = true
    audioSrc.play()
    audioSrc.addEventListener('timeupdate', e => {
        localStorage.setItem('audio_time', JSON.stringify({ currentTime: audioSrc.currentTime }))
    })
    resumeBtn.classList.remove('show')
}

audioSrc.addEventListener('loadedmetadata', e => {
    init()
})

function init() {
    audioCtx = new AudioContext()
    let analyser = new AnalyserNode(audioCtx)
    let mediaSrc = audioCtx.createMediaElementSource(audioSrc)
    mediaSrc
        .connect(analyser)
        .connect(audioCtx.destination)
    audioCtx.resume()
    // destination.

    analyser.fftSize = 512
    let bufferSize = analyser.frequencyBinCount
    let data = new Uint8Array(bufferSize)
    let lastUpdate = 0

    requestAnimationFrame(animate)

    function animate(current) {
        let diff = current - lastUpdate

        // if (diff < 5) {
        //     return requestAnimationFrame(animate)
        // }

        analyser.getByteFrequencyData(data)
        // ctx.fillStyle = 'rgba(0,0,0,1)'
        ctx.clearRect(0, 0, canvas.width, canvas.height)


        let rotation = (Math.PI * 2) / bufferSize
        let barWidth = rotation * (bufferSize)

        ctx.save()
        ctx.translate(canvas.width / 2, canvas.height / 2)
        for (let i = 0; i < bufferSize; i++) {
            let barHeight = data[i]

            ctx.fillStyle = `hsl(${(i / bufferSize * 360 * 1 / 2) + 180}, 85%, 50%)`
            ctx.fillRect(0, 0, barWidth, barHeight)
            ctx.rotate(rotation * (i + 1))
        }
        ctx.restore()
        barWidth = canvas.width / bufferSize/2
        for (let i = 0; i < bufferSize; i++) {
            let barHeight = (data[i] / 255) * canvas.height/2
            let x = barWidth * i
            let y = (canvas.height - barHeight);
            ctx.fillStyle = `hsl(${(i / bufferSize * 360/2)}, 100%, 50%)`
            ctx.fillRect(x, y, barWidth, barHeight)
        }

        drawText()

        lastUpdate = current
        requestAnimationFrame(animate)

    }
}

function resize() {
    canvas.width = canvas.getBoundingClientRect().width * window.devicePixelRatio
    canvas.height = canvas.getBoundingClientRect().height * window.devicePixelRatio
}


function drawText() {
    ctx.save()
    ctx.font = "14px 'Segoe UI', sans-serif"
    ctx.fillStyle = "rgba(200,200,200,.2)"
    ctx.strokeStyle = "rgba(255,200,200,.4)"
    ctx.translate(canvas.width / 2 - 100, canvas.height / 2)
    ctx.fillText('Drag & Drop', 60, 0)
    ctx.font = "20px cursive, sans-serif"
    ctx.fillStyle = "rgba(200,200,200,.2)"

    ctx.strokeText('🤩Valentin Music🤩', 0, 40)
    ctx.restore()
}


addFilebtn.addEventListener('click', e => fileInput.click());
fileInput.addEventListener('change', e => {
    if (e.target.files[0]) {
        fileHandler(e.target.files[0])
    }
})

function fileHandler(file, isDrop=false) {
    if (audioSrc.canPlayType(file.type)) {
        resumeBtn.classList.remove('show')
        if (isDrop) {   
            document.body.classList.add('drop')
            setTimeout(() => document.body.classList.remove('drop'), 500)
        }
        audioSrc.src = URL.createObjectURL(file)
        audioSrc.loop = true
        audioSrc.play().catch(err => {
            alert("Sorry, can't play the media file. Try again! 😥")
        })

        // console.log(file.size)
        if (file.size > 4950000) {
            return
        }

        // save small files to local storage
        let reader = new FileReader()
        reader.readAsDataURL(file)
        reader.addEventListener('loadend', e => {
            localStorage.setItem('audio', reader.result)
            audioSrc.addEventListener('timeupdate', e => {
                localStorage.setItem('audio_time', JSON.stringify({ currentTime: audioSrc.currentTime }))
            })
        })
    } else {
        alert("Unsupported media type. Try another! 😥")
    }
}