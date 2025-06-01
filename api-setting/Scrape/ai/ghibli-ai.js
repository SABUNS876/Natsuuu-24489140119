/**
 * Wm: Nopal ganteng
 * hapus wm boleh tapi doakan kesahatan yang bikin
 * Jangan lupa sholat
 * Base: https://ghibliai.ai
 * Eror chat saja ma 
 */
const axios = require("axios");
const uploadFile = require("cloudku-uploader");
const fs = require("fs/promises");
const fs2 = require("fs");

const tem = 'temp';
if (!fs2.existsSync(tem)) {
  fs2.mkdirSync(tem);
}
const baseHeaders = {
  "Content-Type": "application/json",
  Origin: "https://ghibliai.ai",
  Referer: "https://ghibliai.ai",
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.0.0 Safari/537.36",
  Accept: "*/*",
};

async function ghibliStartTransformation(
  imageUrl,
  prompt = "Please convert this image into Studio Ghibli art style with the Ghibli AI generator.",
  sessionId = "28edb23e-7bcb-4f9a-b4fe-64554b0ac255"
) {
  try {
    const payload = {
      imageUrl: imageUrl,
      sessionId: sessionId,
      prompt: prompt,
      timestamp: Date.now(),
    };
    const uploadUrl = "https://ghibliai.ai/api/transform-stream";
    const initialResponse = await axios.post(uploadUrl, payload, {
      headers: baseHeaders,
    });
    const initialData = initialResponse.data;

    if (!initialData.taskId) {
      console.error("taskId tidak ditemukan dalam respons awal.", initialData);
      return {
        error: true,
        message: "taskId tidak ditemukan dalam respons awal.",
        data: initialData
      };
    }
    await new Promise(resolve => setTimeout(resolve, 5000));
    const initialStatus = await ghibliCheckTransformationStatus(initialData.taskId);
    return initialStatus;
  } catch (error) {
    let errorMessage = "Terjadi kesalahan selama memulai proses Ghibli AI.";
    if (error.message) {
        errorMessage = error.message;
    }
    console.error("Error di ghibliStartTransformation:", errorMessage, error.response?.data);
    return {
        error: true,
        message: errorMessage,
        responseData: error.response?.data,
        status: error.response?.status
    };
  }
}

async function ghibliCheckTransformationStatus(taskId) {
  const resultUrl = `https://ghibliai.ai/api/transform-stream?taskId=${taskId}`;
  try {
    const response = await axios.get(resultUrl, { headers: baseHeaders });
    const responseData = response.data;
    if (typeof responseData === 'object' && responseData !== null && !responseData.taskId) {
        responseData.taskId = taskId;
    } else if (typeof responseData !== 'object' || responseData === null) {
        return { taskId: taskId, rawData: responseData, status: 'unknown', message: "Respons tidak valid atau kosong dari server Ghibli." };
    }
    return responseData;
  } catch (error) {
    let errorMessage = `Error saat memeriksa status untuk taskId ${taskId}.`;
    if (error.message) {
        errorMessage = error.message;
    }
    console.error("Error di ghibliCheckTransformationStatus:", errorMessage, error.response?.data);
    return {
        error: true,
        message: errorMessage,
        taskId: taskId,
        responseData: error.response?.data,
        status: error.response?.status
    };
  }
}

async function ghibli(imageUrl, prompt) {
  let currentStatus = await ghibliStartTransformation(imageUrl, prompt);
  if (!currentStatus || currentStatus.error || !currentStatus.taskId) {
    console.error("Gagal memulai transformasi atau taskId tidak ditemukan:", currentStatus);
    return {
      source: 'ghibliStartTransformation',
      success: false,
      message: currentStatus?.message || "Gagal memulai transformasi atau taskId tidak valid.",
      details: currentStatus
    };
  }
  const maxAttempts = 12;
  const pollInterval = 10000;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (currentStatus.imageUrl) {
      break;
    }
    if (currentStatus.status && ['failed', 'error'].includes(currentStatus.status.toLowerCase()) && !currentStatus.imageUrl) {
        console.error(`Proses transformasi Ghibli gagal dengan status: ${currentStatus.status} untuk taskId: ${currentStatus.taskId}.`, currentStatus);
        return {
            source: 'pollingGhibliApiFailure',
            success: false,
            message: `Proses transformasi Ghibli gagal dengan status: ${currentStatus.status}`,
            details: currentStatus
        };
    }
    if (currentStatus.status !== 'processing' && currentStatus.status !== 'pending' && currentStatus.status !== 'success' && !currentStatus.imageUrl) {
        console.error(`Status tidak terduga (${currentStatus.status}) dari Ghibli API  untuk taskId: ${currentStatus.taskId}.`, currentStatus);
        return {
            source: 'pollingUnexpectedGhibliStatus',
            success: false,
            message: `Proses transformasi berhenti karena status Ghibli API tidak terduga: ${currentStatus.status}`,
            details: currentStatus
        };
    }
    await new Promise(resolve => setTimeout(resolve, pollInterval));

    currentStatus = await ghibliCheckTransformationStatus(currentStatus.taskId);

    if (!currentStatus || currentStatus.error) {
      console.error("Error saat memeriksa status Ghibli dalam loop:", currentStatus);
      return {
        source: 'ghibliCheckTransformationStatusPollingError',
        success: false,
        message: currentStatus?.message || "Error saat memeriksa status Ghibli.",
        details: currentStatus
      };
    }
    if (!currentStatus.taskId && !currentStatus.rawData && !currentStatus.imageUrl) {
        console.error("Gagal mendapatkan status Ghibli: taskId hilang atau respons tidak valid .", currentStatus);
        return {
            source: 'pollingInvalidGhibliResponse',
            success: false,
            message: "Respons status Ghibli tidak valid atau taskId hilang .",
            details: currentStatus
        };
    }

    if (attempt === maxAttempts - 1 && !currentStatus.imageUrl) {
      console.error("Proses transformasi Ghibli gagal: imageUrl tidak ditemukan setelah semua percobaan.", currentStatus);
      return {
        source: 'pollingTimeoutGhibli',
        success: false,
        message: "Batas waktu polling Ghibli tercapai, imageUrl tidak ditemukan.",
        details: currentStatus
      };
    }
  }

  if (currentStatus && currentStatus.imageUrl) {
    const transformedImageUrl = currentStatus.imageUrl;
    let tempFilePath = '';

    try {
      const imageDownloadResponse = await axios.get(transformedImageUrl,
        {
          headers: baseHeaders,
          responseType: 'arraybuffer'
        }
      );
      const imageData = imageDownloadResponse.data;
      let extension = '.jpg';
      const match = transformedImageUrl.match(/\.(jpeg|jpg|gif|png)(\?|$)/i);
      if (match) {
          extension = '.' + match[1];
      }
      const tempFileName = `transformed_ghibli_${Date.now()}${extension}`;
      tempFilePath = `${tem}/${tempFileName}`;
      await fs.writeFile(tempFilePath, Buffer.from(imageData));
      const fileBuffer = await fs.readFile(tempFilePath);
      const uploadedResult = await uploadFile(fileBuffer);
      await fs.unlink(tempFilePath); 
      if (uploadedResult) {
        if (uploadedResult.status === 'success' && uploadedResult.result && typeof uploadedResult.result.url === 'string') {
          return { success: true, source: 'cloudkuUploadSuccess', uploadedUrl: uploadedResult.result.url, details: uploadedResult };
        } else if (uploadedResult.status === 'error') {
          console.error("Error saat upload ke CloudKu:", uploadedResult.message || "Status error dari CloudKu", uploadedResult);
          return { success: false, source: 'cloudkuUploadError', message: uploadedResult.message || "Status error dari CloudKu", details: uploadedResult };
        } else if (typeof uploadedResult === 'string' && uploadedResult.startsWith('http')) { 
          return { success: true, source: 'cloudkuUploadSuccessDirectUrl', uploadedUrl: uploadedResult, details: { url: uploadedResult } };
        } else {
          console.error("Format hasil upload CloudKu tidak dikenali:", uploadedResult);
          return { success: false, source: 'cloudkuUploadUnknownFormat', message: 'Format hasil upload CloudKu tidak dikenali.', details: uploadedResult };
        }
      } else {
        console.error("Hasil upload CloudKu kosong atau tidak terdefinisi.");
        return { success: false, source: 'cloudkuUploadEmpty', message: 'Hasil upload CloudKu kosong atau tidak terdefinisi.', details: null };
      }

    } catch (downloadUploadError) {
      console.error("Error selama proses download gambar Ghibli atau upload ke CloudKu:", downloadUploadError.message);
      let errorDetails = {
          message: downloadUploadError.message,
          response: null,
          status: null,
          isAxiosError: downloadUploadError.isAxiosError || false
      };
      if (downloadUploadError.response) {
        let errorData = downloadUploadError.response.data;
        if (errorData instanceof Buffer) {
          try {
            errorData = JSON.parse(errorData.toString());
          } catch (e) {
            errorData = errorData.toString();
          }
        }
        errorDetails.response = errorData;
        errorDetails.status = downloadUploadError.response.status;
        console.error("Detail error response (download/upload):", errorData);
        console.error("Status error response (download/upload):", downloadUploadError.response.status);
      } else {
        console.error("Detail error (download/upload):", downloadUploadError);
      }
      if (tempFilePath && fs2.existsSync(tempFilePath)) {
        try {
          await fs.unlink(tempFilePath);
        } catch (cleanupError) {
          console.error(`Gagal menghapus file sementara (setelah error download/upload): ${tempFilePath}`, cleanupError);
        }
      }
      return { success: false, source: 'downloadOrUploadError', message: "Error selama proses download gambar Ghibli atau upload ke CloudKu.", details: errorDetails };
    }
  } else if (currentStatus && currentStatus.error) {
    console.error("Proses transformasi Ghibli gagal dengan error dari API sebelum download:", currentStatus.message, currentStatus.responseData || "");
    return { success: false, source: 'ghibliApiErrorBeforeDownload', message: currentStatus.message, details: currentStatus };
  } else if (!currentStatus || !currentStatus.imageUrl) {
    console.error("Proses transformasi Ghibli gagal, imageUrl tidak ditemukan atau status Ghibli tidak valid setelah polling.", currentStatus);
    return { success: false, source: 'postPollingGhibliFailure', message: "imageUrl Ghibli tidak ditemukan atau status tidak valid.", details: currentStatus };
  }
  console.error("Terjadi kesalahan tidak diketahui di akhir fungsi ghibli.", currentStatus);
  return { success: false, source: 'unknownGhibliFailure', message: "Terjadi kesalahan tidak diketahui dalam proses Ghibli.", details: currentStatus };
}

// Export fungsi-fungsi yang ingin diekspos
module.exports = {
  ghibliStartTransformation,
  ghibliCheckTransformationStatus,
  ghibli
};
