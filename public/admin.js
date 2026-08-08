/*==========================================================================
   LIVESTREAM - ADMIN DASHBOARD CONTROLLER
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
  // Tabs selectors
  const posterTabUrl = document.getElementById('poster-tab-url');
  const posterTabFile = document.getElementById('poster-tab-file');
  const posterUrlContainer = document.getElementById('poster-url-container');
  const posterFileContainer = document.getElementById('poster-file-container');
  const posterFile = document.getElementById('posterFile');
  const posterFileName = document.getElementById('poster-file-name');
  const videoTabUrl = document.getElementById('video-tab-url');
  const videoTabFile = document.getElementById('video-tab-file');
  const videoUrlContainer = document.getElementById('video-url-container');
  const videoFileContainer = document.getElementById('video-file-container');
  const videoFile = document.getElementById('videoFile');
  const videoFileName = document.getElementById('video-file-name');
  // Form & Progress
  const uploadForm = document.getElementById('upload-form');
  const progressContainer = document.getElementById('progress-container');
  const progressBar = document.getElementById('progress-bar');
  const progressPct = document.getElementById('progress-pct');
  const progressStatus = document.getElementById('progress-status');
  const statusBox = document.getElementById('status-box');
  // Active inputs states
  let activePosterSource = 'url'; // 'url' or 'file'
  let activeVideoSource = 'url';  // 'url' or 'file'

  // --- POSTER TAB SWITCHES ---
  posterTabUrl.addEventListener('click', () => {
    posterTabUrl.classList.add('active');
    posterTabFile.classList.remove('active');
    posterUrlContainer.style.display = 'block';
    posterFileContainer.style.display = 'none';
    activePosterSource = 'url';
  });
  posterTabFile.addEventListener('click', () => {
    posterTabFile.classList.add('active');
    posterTabUrl.classList.remove('active');
    posterFileContainer.style.display = 'block';
    posterUrlContainer.style.display = 'none';
    activePosterSource = 'file';
  });
  posterFile.addEventListener('change', () => {
    if (posterFile.files && posterFile.files[0]) {
      posterFileName.textContent = `Selected Cover: ${posterFile.files[0].name}`;
      posterFileName.style.display = 'block';
    } else {
      posterFileName.style.display = 'none';
    }
  });
  // Ensure clicking the wrapper triggers the file input dialog
  document.querySelectorAll('.file-input-wrapper').forEach(wrapper => {
    wrapper.addEventListener('click', (e) => {
      const fileInput = wrapper.querySelector('input[type="file"]');
      if (e.target !== fileInput) {
        fileInput.click();
      }
    });
  });

  // --- VIDEO TAB SWITCHES ---
  videoTabUrl.addEventListener('click', () => {
    videoTabUrl.classList.add('active');
    videoTabFile.classList.remove('active');
    videoUrlContainer.style.display = 'block';
    videoFileContainer.style.display = 'none';
    activeVideoSource = 'url';
  });
  videoTabFile.addEventListener('click', () => {
    videoTabFile.classList.add('active');
    videoTabUrl.classList.remove('active');
    videoFileContainer.style.display = 'block';
    videoUrlContainer.style.display = 'none';
    activeVideoSource = 'file';
  });
  videoFile.addEventListener('change', () => {
    if (videoFile.files && videoFile.files[0]) {
      videoFileName.textContent = `Selected Video: ${videoFile.files[0].name}`;
      videoFileName.style.display = 'block';
    } else {
      videoFileName.style.display = 'none';
    }
  });

  // --- FORM SUBMIT HANDLER ---
  uploadForm.addEventListener('submit', (e) => {
    e.preventDefault();
    // Reset status
    statusBox.style.display = 'none';
    statusBox.className = 'status-msg';

    // Validate inputs based on toggled tabs
    if (activePosterSource === 'file' && (!posterFile.files || !posterFile.files[0])) {
      showError("Please select a poster cover file to upload, or switch to URL Link.");
      return;
    }
    if (activeVideoSource === 'file' && (!videoFile.files || !videoFile.files[0])) {
      showError("Please select a movie video file to upload, or switch to URL Link.");
      return;
    }

    // Compile FormData
    const formData = new FormData();
    formData.append('title', document.getElementById('title').value);
    formData.append('type', document.getElementById('type').value);
    formData.append('releaseDate', document.getElementById('releaseDate').value);
    formData.append('actors', document.getElementById('actors').value);
    formData.append('studio', document.getElementById('studio').value);
    formData.append('country', document.getElementById('country').value);
    formData.append('genres', document.getElementById('genres').value);
    formData.append('rating', document.getElementById('rating').value);
    formData.append('description', document.getElementById('description').value);
    if (activePosterSource === 'url') {
      formData.append('posterUrl', document.getElementById('posterUrl').value);
    } else {
      formData.append('posterFile', posterFile.files[0]);
    }
    if (activeVideoSource === 'url') {
      formData.append('videoUrl', document.getElementById('videoUrl').value);
    } else {
      formData.append('videoFile', videoFile.files[0]);
    }
    // Initialize progress bar
    progressContainer.style.display = 'block';
    progressBar.style.width = '0%';
    progressPct.textContent = '0%';
    progressStatus.textContent = 'Sending request to publishing server...';
    // Submit via AJAX XHR to track progress
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/movies', true);

    // Track upload progress
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100);
        progressBar.style.width = `${percent}%`;
        progressPct.textContent = `${percent}%`;

        if (percent === 100) {
          progressStatus.textContent = 'Processing files on the server...';
        } else {
          progressStatus.textContent = `Uploading files... (${formatBytes(event.loaded)} / ${formatBytes(event.total)})`;
        }
      }
    };
    // Handle response
    xhr.onload = () => {
      progressContainer.style.display = 'none';
      if (xhr.status === 201) {
        const res = JSON.parse(xhr.responseText);
        showSuccess(`Successfully published "${res.item.title}"! Redirecting back to catalog...`);
        uploadForm.reset();
        posterFileName.style.display = 'none';
        videoFileName.style.display = 'none';

        // Redirect home after 2.5 seconds
        setTimeout(() => {
          window.location.href = '/';
        }, 2500);
      } else {
        try {
          const res = JSON.parse(xhr.responseText);
          showError(res.error || 'Failed to publish content.');
        } catch (e) {
          showError('An unexpected server error occurred.');
        }
      }
    };

    xhr.onerror = () => {
      progressContainer.style.display = 'none';
      showError('Network error occurred. Make sure the server is running.');
    };
    xhr.send(formData);
  });

  // Helper displays
  function showError(msg) {
    statusBox.textContent = msg;
    statusBox.classList.add('status-error');
    statusBox.style.display = 'block';
    statusBox.scrollIntoView({ behavior: 'smooth' });
  }
  function showSuccess(msg) {
    statusBox.textContent = msg;
    statusBox.classList.add('status-success');
    statusBox.style.display = 'block';
    statusBox.scrollIntoView({ behavior: 'smooth' });
  }
  function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }
});
