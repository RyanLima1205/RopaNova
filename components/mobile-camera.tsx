"use client"

import React from "react"

import { useState, useRef, useCallback } from "react"
import { Camera, X, RotateCcw, Check, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent } from "@/components/ui/dialog"

interface MobileCameraProps {
  onCapture: (file: File) => void
  isOpen: boolean
  onClose: () => void
}

export function MobileCamera({ onCapture, isOpen, onClose }: MobileCameraProps) {
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment")
  const [isLoading, setIsLoading] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const startCamera = useCallback(async () => {
    try {
      setIsLoading(true)
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      })

      setStream(mediaStream)
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }
    } catch (error) {
      console.error("Error accessing camera:", error)
      // Fallback to file input if camera access fails
    } finally {
      setIsLoading(false)
    }
  }, [facingMode])

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
      setStream(null)
    }
  }, [stream])

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext("2d")

    if (!context) return

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    context.drawImage(video, 0, 0)

    canvas.toBlob(
      (blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob)
          setCapturedImage(url)
        }
      },
      "image/jpeg",
      0.8,
    )
  }, [])

  const confirmPhoto = useCallback(() => {
    if (!capturedImage || !canvasRef.current) return

    canvasRef.current.toBlob(
      (blob) => {
        if (blob) {
          const file = new File([blob], `photo-${Date.now()}.jpg`, { type: "image/jpeg" })
          onCapture(file)
          handleClose()
        }
      },
      "image/jpeg",
      0.8,
    )
  }, [capturedImage, onCapture])

  const retakePhoto = useCallback(() => {
    setCapturedImage(null)
    if (capturedImage) {
      URL.revokeObjectURL(capturedImage)
    }
  }, [capturedImage])

  const switchCamera = useCallback(() => {
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"))
    stopCamera()
  }, [stopCamera])

  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (file) {
        onCapture(file)
        handleClose()
      }
    },
    [onCapture],
  )

  const handleClose = useCallback(() => {
    stopCamera()
    setCapturedImage(null)
    onClose()
  }, [stopCamera, onClose])

  // Start camera when dialog opens
  React.useEffect(() => {
    if (isOpen && !capturedImage) {
      startCamera()
    }
    return () => {
      if (!isOpen) {
        stopCamera()
      }
    }
  }, [isOpen, capturedImage, startCamera, stopCamera])

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      stopCamera()
      if (capturedImage) {
        URL.revokeObjectURL(capturedImage)
      }
    }
  }, [stopCamera, capturedImage])

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md p-0 bg-black">
        <div className="relative w-full h-[80vh] flex flex-col">
          {!capturedImage ? (
            <>
              {/* Camera View */}
              <div className="flex-1 relative overflow-hidden">
                {stream ? (
                  <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gray-900 flex items-center justify-center">
                    {isLoading ? (
                      <div className="text-white text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                        <p>Iniciando cámara...</p>
                      </div>
                    ) : (
                      <div className="text-white text-center">
                        <Camera className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                        <p className="mb-4">No se pudo acceder a la cámara</p>
                        <Button
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                          className="bg-white text-black"
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Seleccionar de Galería
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {/* Camera Controls Overlay */}
                {stream && (
                  <div className="absolute inset-0 pointer-events-none">
                    {/* Top Controls */}
                    <div className="absolute top-4 left-4 right-4 flex justify-between pointer-events-auto">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleClose}
                        className="bg-black/50 text-white hover:bg-black/70"
                      >
                        <X className="h-5 w-5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={switchCamera}
                        className="bg-black/50 text-white hover:bg-black/70"
                      >
                        <RotateCcw className="h-5 w-5" />
                      </Button>
                    </div>

                    {/* Bottom Controls */}
                    <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 pointer-events-auto">
                      <div className="flex items-center gap-4">
                        <Button
                          variant="ghost"
                          onClick={() => fileInputRef.current?.click()}
                          className="bg-black/50 text-white hover:bg-black/70 rounded-full p-3"
                        >
                          <Upload className="h-5 w-5" />
                        </Button>

                        <Button
                          onClick={capturePhoto}
                          className="bg-white hover:bg-gray-200 text-black rounded-full p-4 w-16 h-16"
                        >
                          <Camera className="h-6 w-6" />
                        </Button>
                      </div>
                    </div>

                    {/* Camera Guidelines */}
                    <div className="absolute inset-0 pointer-events-none">
                      <div className="w-full h-full border-2 border-white/20 m-8">
                        <div className="w-full h-full border border-white/40 relative">
                          {/* Rule of thirds lines */}
                          <div className="absolute top-1/3 left-0 right-0 border-t border-white/20"></div>
                          <div className="absolute top-2/3 left-0 right-0 border-t border-white/20"></div>
                          <div className="absolute left-1/3 top-0 bottom-0 border-l border-white/20"></div>
                          <div className="absolute left-2/3 top-0 bottom-0 border-l border-white/20"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              {/* Preview View */}
              <div className="flex-1 relative">
                <img src={capturedImage || "/placeholder.svg"} alt="Captured" className="w-full h-full object-cover" />

                {/* Preview Controls */}
                <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
                  <div className="flex items-center gap-4">
                    <Button
                      variant="ghost"
                      onClick={retakePhoto}
                      className="bg-black/50 text-white hover:bg-black/70 rounded-full p-3"
                    >
                      <X className="h-5 w-5" />
                    </Button>

                    <Button
                      onClick={confirmPhoto}
                      className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-full p-4 w-16 h-16"
                    >
                      <Check className="h-6 w-6" />
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Hidden canvas for image processing */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
