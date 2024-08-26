import React, { useState, useEffect } from "react"
import WebTorrent from "webtorrent/dist/webtorrent.min.js"

function App() {
  // Khởi tạo WebTorrent client với cấu hình tracker server
  const [torrentClient] = useState(
    new WebTorrent({
      tracker: ["wss://tracker.openwebtorrent.com"], // Thay thế bằng tracker server của bạn nếu cần
    })
  )
  const [torrentLink, setTorrentLink] = useState("")
  const [downloadLink, setDownloadLink] = useState("")
  const [ws, setWs] = useState(null)

  useEffect(() => {
    // Khởi tạo WebSocket và kết nối với signaling server
    const websocket = new WebSocket("wss://be-p2p.onrender.com")
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
    torrentClient.add(magnetURI, (torrent) => {
      torrent.files.forEach((file) => {
        file.getBlobURL((err, url) => {
          if (err) throw err
          setDownloadLink(url)
        })
      })
    })
  }

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

      {downloadLink && (
        <div>
          <h2>Download your file:</h2>
          <a href={downloadLink} download>
            Download File
          </a>
        </div>
      )}
    </div>
  )
}

export default App
