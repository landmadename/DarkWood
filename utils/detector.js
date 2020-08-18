var cv;

function init(cv_input) {
  cv = cv_input;
}

function canny(mat, ksize, blockSize) {
  cv.cvtColor(mat, mat, cv.COLOR_RGBA2GRAY, 0)
  // gauss = cv2.GaussianBlur(gray, (ksize, ksize), 0.3*((ksize-1)*0.5-1)+0.8)
}

function detect(mat) {
  canny(mat, 0, 0)
  return mat
}

module.exports = {
  init: init,
  detect: detect
}