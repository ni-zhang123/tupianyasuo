document.addEventListener('DOMContentLoaded', function() {
    const imageInput = document.getElementById('imageInput');
    const uploadButton = document.getElementById('uploadButton');
    const compressButton = document.getElementById('compressButton');
    const downloadButton = document.getElementById('downloadButton');
    const qualitySlider = document.getElementById('qualitySlider');
    const qualityValue = document.getElementById('qualityValue');
    const originalPreview = document.getElementById('originalPreview');
    const compressedPreview = document.getElementById('compressedPreview');
    const originalSize = document.getElementById('originalSize');
    const compressedSize = document.getElementById('compressedSize');
    const widthInput = document.getElementById('widthInput');
    const heightInput = document.getElementById('heightInput');
    const maintainAspectRatio = document.getElementById('maintainAspectRatio');
    const cropButton = document.getElementById('cropButton');
    const cropperContainer = document.getElementById('cropperContainer');
    const cropperImage = document.getElementById('cropperImage');
    const cropConfirmButton = document.getElementById('cropConfirmButton');
    const cropCancelButton = document.getElementById('cropCancelButton');
    const widthUnit = document.getElementById('widthUnit');
    const heightUnit = document.getElementById('heightUnit');
    
    let originalFile = null;
    let compressedFile = null;
    let originalWidth = 0;
    let originalHeight = 0;
    let aspectRatio = 1;
    let cropper = null;
    let croppedImage = null;
    let initialFile = null;

    uploadButton.addEventListener('click', () => {
        imageInput.click();
    });

    imageInput.addEventListener('change', async (e) => {
        if (e.target.files.length === 0) return;
        
        initialFile = e.target.files[0];
        originalFile = initialFile;
        
        // 获取原始图片尺寸
        const img = new Image();
        img.onload = function() {
            originalWidth = img.width;
            originalHeight = img.height;
            aspectRatio = originalWidth / originalHeight;
            
            // 设置输入框的值和占位符
            const displayWidth = convertFromPixels(originalWidth, widthUnit.value);
            const displayHeight = convertFromPixels(originalHeight, heightUnit.value);
            
            // 设置输入框的值
            widthInput.value = displayWidth;
            heightInput.value = displayHeight;
            
            // 设置输入框的占位符，显示原始像素值
            widthInput.placeholder = `${originalWidth}px`;
            heightInput.placeholder = `${originalHeight}px`;
        };
        img.src = URL.createObjectURL(originalFile);
        
        // 显示原始图片预览
        originalPreview.src = URL.createObjectURL(originalFile);
        originalSize.textContent = formatFileSize(originalFile.size);
        
        // 显示压缩控制和预览区域
        document.querySelector('.compression-controls').style.display = 'block';
        document.querySelector('.preview-container').style.display = 'block';
        
        // 清除之前的压缩结果
        compressedPreview.src = '';
        compressedSize.textContent = '0 KB';
        downloadButton.style.display = 'none';
    });

    qualitySlider.addEventListener('input', (e) => {
        qualityValue.textContent = e.target.value + '%';
    });

    // 单位转换函数
    function convertToPixels(value, unit) {
        const dpi = 96; // 标准显示器DPI
        switch(unit) {
            case 'cm':
                return Math.round(value * dpi / 2.54);
            case 'in':
                return Math.round(value * dpi);
            case 'mm':
                return Math.round(value * dpi / 25.4);
            default:
                return value;
        }
    }

    function convertFromPixels(pixels, unit) {
        const dpi = 96;
        switch(unit) {
            case 'cm':
                return (pixels * 2.54 / dpi).toFixed(2);
            case 'in':
                return (pixels / dpi).toFixed(2);
            case 'mm':
                return (pixels * 25.4 / dpi).toFixed(1);
            default:
                return pixels;
        }
    }

    // 修改宽度输入处理
    widthInput.addEventListener('input', function() {
        const pixelWidth = convertToPixels(parseFloat(this.value) || originalWidth, widthUnit.value);
        if (maintainAspectRatio.checked) {
            const pixelHeight = Math.round(pixelWidth / aspectRatio);
            heightInput.value = convertFromPixels(pixelHeight, heightUnit.value);
        }
    });

    // 修改高度输入处理
    heightInput.addEventListener('input', function() {
        const pixelHeight = convertToPixels(parseFloat(this.value) || originalHeight, heightUnit.value);
        if (maintainAspectRatio.checked) {
            const pixelWidth = Math.round(pixelHeight * aspectRatio);
            widthInput.value = convertFromPixels(pixelWidth, widthUnit.value);
        }
    });

    // 处理单位变化 - 修改为同步两个单位
    widthUnit.addEventListener('change', function() {
        // 同步两个选择框的值
        heightUnit.value = this.value;
        
        // 更新宽度值
        const currentWidthPixels = convertToPixels(parseFloat(widthInput.value), this.value);
        widthInput.value = convertFromPixels(currentWidthPixels, this.value);
        
        // 更新高度值
        const currentHeightPixels = convertToPixels(parseFloat(heightInput.value), this.value);
        heightInput.value = convertFromPixels(currentHeightPixels, this.value);
    });

    heightUnit.addEventListener('change', function() {
        // 同步两个选择框的值
        widthUnit.value = this.value;
        
        // 更新高度值
        const currentHeightPixels = convertToPixels(parseFloat(heightInput.value), this.value);
        heightInput.value = convertFromPixels(currentHeightPixels, this.value);
        
        // 更新宽度值
        const currentWidthPixels = convertToPixels(parseFloat(widthInput.value), this.value);
        widthInput.value = convertFromPixels(currentWidthPixels, this.value);
    });

    compressButton.addEventListener('click', async () => {
        if (!originalFile) return;

        const width = convertToPixels(parseFloat(widthInput.value), widthUnit.value) || originalWidth;
        const height = convertToPixels(parseFloat(heightInput.value), heightUnit.value) || originalHeight;
        const quality = qualitySlider.value / 100;
        
        // 获取消息元素
        const messageEl = document.getElementById('compressionMessage');
        // 清除之前的消息
        messageEl.className = 'compression-message';
        messageEl.textContent = '';

        try {
            // 首先创建一个canvas来调整图片大小
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = width;
            canvas.height = height;

            // 加载原始图片
            const img = new Image();
            img.onload = function() {
                // 在canvas上绘制调整大小后的图片
                ctx.drawImage(img, 0, 0, width, height);
                
                // 使用设定的质量将canvas转换为blob
                canvas.toBlob(
                    async (blob) => {
                        compressedFile = blob;
                        compressedPreview.src = URL.createObjectURL(compressedFile);
                        compressedSize.textContent = formatFileSize(compressedFile.size);
                        downloadButton.style.display = 'block';

                        // 计算并显示压缩率
                        const compressionRatio = ((1 - blob.size / originalFile.size) * 100).toFixed(1);
                        messageEl.textContent = `压缩成功！压缩率：${compressionRatio}%`;
                        messageEl.className = 'compression-message success show';

                        // 0.5秒后开始淡出
                        setTimeout(() => {
                            messageEl.classList.add('hide');
                            // 等待淡出动画完成后移除元素
                            setTimeout(() => {
                                messageEl.className = 'compression-message';
                                messageEl.textContent = '';
                            }, 300); // 300ms是淡出动画的持续时间
                        }, 500);
                    },
                    originalFile.type,
                    quality
                );
            };
            
            // 重要：每次都使用原始图片来源
            img.src = URL.createObjectURL(originalFile);
            
        } catch (error) {
            console.error('压缩失败:', error);
            messageEl.textContent = '压缩失败，请重试';
            messageEl.className = 'compression-message error show';

            setTimeout(() => {
                messageEl.classList.add('hide');
                setTimeout(() => {
                    messageEl.className = 'compression-message';
                    messageEl.textContent = '';
                }, 300);
            }, 500);
        }
    });

    downloadButton.addEventListener('click', () => {
        if (!compressedFile) return;
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(compressedFile);
        link.download = `compressed_${originalFile.name}`;
        link.click();
    });

    // 处理裁剪按钮点击
    cropButton.addEventListener('click', () => {
        if (!initialFile) return;
        
        cropperContainer.style.display = 'flex';
        cropperImage.src = URL.createObjectURL(initialFile);
        
        // 初始化裁剪器
        cropper = new Cropper(cropperImage, {
            aspectRatio: NaN, // 自由比例
            viewMode: 1,
            guides: true,
            center: true,
            highlight: false,
            background: false,
            autoCropArea: 0.8,
        });
    });

    // 确认裁剪
    cropConfirmButton.addEventListener('click', () => {
        if (!cropper) return;

        // 获取裁剪后的canvas
        const canvas = cropper.getCroppedCanvas();
        
        // 转换为blob
        canvas.toBlob((blob) => {
            // 更新当前工作文件，但保持初始文件不变
            originalFile = new File([blob], initialFile.name, { type: initialFile.type });
            
            // 更新预览和尺寸
            originalPreview.src = URL.createObjectURL(originalFile);
            originalSize.textContent = formatFileSize(originalFile.size);
            
            // 更新宽高输入框
            widthInput.value = convertFromPixels(canvas.width, widthUnit.value);
            heightInput.value = convertFromPixels(canvas.height, heightUnit.value);
            originalWidth = canvas.width;
            originalHeight = canvas.height;
            aspectRatio = originalWidth / originalHeight;
            
            // 清除压缩结果
            compressedPreview.src = '';
            compressedSize.textContent = '0 KB';
            downloadButton.style.display = 'none';
        }, initialFile.type);

        // 销毁裁剪器并隐藏容器
        cropper.destroy();
        cropperContainer.style.display = 'none';
        cropper = null;
    });

    // 取消裁剪
    cropCancelButton.addEventListener('click', () => {
        if (cropper) {
            cropper.destroy();
            cropper = null;
        }
        cropperContainer.style.display = 'none';
    });

    function formatFileSize(bytes) {
        if (bytes === 0) return '0 KB';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}); 