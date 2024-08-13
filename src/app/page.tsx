'use client';
import { bootstrapCameraKit, createMediaStreamSource } from '@snap/camera-kit';
import { useEffect, useState } from 'react';


export default function Home() {

  const [isRecording, setIsRecording] = useState(false);
  const apiToken = "eyJhbGciOiJIUzI1NiIsImtpZCI6IkNhbnZhc1MyU0hNQUNQcm9kIiwidHlwIjoiSldUIn0.eyJhdWQiOiJjYW52YXMtY2FudmFzYXBpIiwiaXNzIjoiY2FudmFzLXMyc3Rva2VuIiwibmJmIjoxNzIzMTgxMzU3LCJzdWIiOiIxNmEzM2RlMy1hMDkzLTRlZTYtYjhhYy1hZDA5NjkzOTlkNGF-U1RBR0lOR34zY2JjMDE5ZC1iZjQ1LTRiOTYtYTZhMC03OGU3Mjg1YTJmODAifQ.zh5Zd2k1_R9lrNAFbg7TM4Vver5DotqjkDQNSP3B1tA";

  /* -------------------------------------------------------------------------- */
  /*                                   snapkit                                  */
  /* -------------------------------------------------------------------------- */
  const lensList = [
    {
      name: "sunglasses",
      lensId: "f4de22de-6d36-47d3-a212-2567134e35af",
      groupId: "edaabdd2-5711-4b50-8818-46c212801a1c",
    },
    {
      name: "hair color",
      lensId: "43293650876",
      groupId: "57413c65-6aac-4789-a215-cdba35346d4c",
    },
  ]

  /* ------------------------------- end snapkit ------------------------------ */


  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null);
  let isInitializing = false;

  const initializeCameraKit = async () => {

    isInitializing = true;
    const currentLensIndex = 1;

    const cameraKit = await bootstrapCameraKit({ apiToken });
    const canvas = document.getElementById('my-canvas') as HTMLCanvasElement;
    const session = await cameraKit.createSession({ liveRenderTarget: canvas });
    const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });

    session.events.addEventListener('error', (event) => {
      if (event.detail.error.name === 'LensExecutionError') {
        console.log('The current Lens encountered an error and was removed.', event.detail.error);
      }
    });

    const lens = await cameraKit.lensRepository.loadLens(lensList[currentLensIndex].lensId, lensList[currentLensIndex].groupId);

    await session.setSource(mediaStream);
    await session.applyLens(lens);
    await session.play();

    setCanvas(canvas);
  }

  const toggleRecording = async () => {
    setIsRecording(!isRecording);

    if (!canvas) return;

    const stream = canvas.captureStream(30);
    const recordingChunks = [] as BlobPart[];
    const mediaRecorder = new MediaRecorder(stream);

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        console.log("Recording data available");
        recordingChunks.push(event.data);
      }
    };

    mediaRecorder.onstop = async () => {
      const blob = new Blob(recordingChunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'video.webm';
      a.click();
      window.URL.revokeObjectURL(url);
    };

    if (isRecording) {
      mediaRecorder.start();
    } else {
      mediaRecorder.stop();
    }

  }


  useEffect(() => {
    if (!navigator) return;
    if (!isInitializing) {
      initializeCameraKit();
    }

  }, [navigator]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-between">
      <div className='shadow-lg'>
        <canvas id='my-canvas' ></canvas>
      </div>
      <div className="flex flex-row items-center justify-around">
        <button
          disabled={!canvas}
          className={`rounded-md text-white p-2 ${isRecording ? "bg-red-500" : "bg-blue-500"} disabled:bg-slate-300`}
          onClick={toggleRecording}>
          {isRecording ? "Stop Recording" : "Start Recording"}
        </button>
      </div>
      <div>
        <label id="percentage">0%</label>
        <progress id="progress-bar" value={0}></progress><br />
      </div>
    </main>
  );
}
