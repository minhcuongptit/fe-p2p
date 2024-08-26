import React, { useState, useEffect } from "react"
import WebTorrent from "webtorrent/dist/webtorrent.min.js"

function App() {
  const [torrentClient, setTorrentClient] = useState(null)

  useEffect(() => {
    const client = new WebTorrent({
      tracker: ["wss://tracker.openwebtorrent.com"], // Thay thế bằng tracker server của bạn nếu cần
    })

    setTorrentClient(client)

    // Clean up on unmount
    return () => client.destroy()
  }, [])
  const [torrentLink, setTorrentLink] = useState("")
  const [downloadLink, setDownloadLink] = useState("")
  const [ws, setWs] = useState(null)

  useEffect(() => {
    // Khởi tạo WebSocket và kết nối với signaling server
    // const websocket = new WebSocket("ws://localhost:8080")
    const websocket = new WebSocket("wss://be-p2p.onrender.com")

    // Xử lý khi kết nối thành công
    websocket.onopen = () => {
      console.log("WebSocket Client Connected")
    }

    // Xử lý khi có lỗi xảy ra
    websocket.onerror = (error) => {
      console.error("WebSocket Error:", error)
    }

    setWs(websocket)

    websocket.onmessage = (message) => {
      // Xử lý tin nhắn từ signaling server
      const data = JSON.parse(message.data)
      // Xử lý các thông điệp theo yêu cầu
    }

    return () => websocket.close()
  }, [])

  const handleFileUpload = (event) => {
    const file = event.target.files[0]
    if (file) {
      torrentClient.seed(file, (torrent) => {
        const torrentURL = `magnet:?xt=urn:btih:${
          torrent.infoHash
        }&dn=${encodeURIComponent(file.name)}`
        setTorrentLink(torrentURL)
        console.log("Torrent created:", torrentURL)
        if (ws) {
          ws.send(JSON.stringify({ type: "new-torrent", url: torrentURL }))
        }
      })
    }
  }

  const handleDownload = (magnetURI) => {
    console.log("magnetURI", magnetURI)

    torrentClient.add(magnetURI, (torrent) => {
      console.log("torrent", torrent)

      torrent.files.forEach((file) => {
        console.log("file", file)

        // Create a read stream from the file
        const readStream = file.createReadStream()

        // Convert the read stream to a blob URL
        const reader = new FileReader()
        reader.onload = function () {
          const blob = new Blob([reader.result], { type: file.mimeType })
          const url = URL.createObjectURL(blob)
          console.log(url)
          setDownloadLink(url)
        }
        reader.readAsArrayBuffer(readStream)
      })
    })
  }

  console.log("downloadLink", downloadLink)

  return (
    <div className="App">
      <h1>P2P File Sharing</h1>
      <input type="file" onChange={handleFileUpload} />
      {torrentLink && (
        <div>
          <h2>Share this magnet link:</h2>
          <p>{torrentLink}</p>
        </div>
      )}
      <input
        type="text"
        placeholder="Enter magnet link to download"
        onChange={(e) => handleDownload(e.target.value)}
      />

      <div>
        <h2>Download your file:</h2>
        <a href={downloadLink} download>
          Download File {downloadLink}
        </a>
      </div>
    </div>
  )
}

export default App
