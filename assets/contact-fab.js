/**
 * 多渠道联系浮动按钮
 * 包含 WhatsApp, 微信, Email, 电话
 * 适用于 Metatecno 网站
 */

(function() {
  'use strict';

  // 配置
  const config = {
    whatsapp: {
      enabled: true,
      number: '862372600785', // +86 23 7260 0785
      message: 'Hello, I\'m interested in your products'
    },
    wechat: {
      enabled: true,
      qrcode: '/assets/wechat-qr.png' // 微信二维码图片路径
    },
    email: {
      enabled: true,
      address: 'info@metatecno.com',
      subject: 'Product Inquiry'
    },
    phone: {
      enabled: true,
      number: '+862372600785',
      display: '+86 23 7260 0785'
    },
    position: 'right', // 'left' or 'right'
    mobileOffset: 80 // 移动端底部偏移（避开其他UI元素）
  };

  // 创建样式
  const style = document.createElement('style');
  style.textContent = `
    /* 主按钮容器 */
    .contact-fab-container {
      position: fixed;
      ${config.position}: 20px;
      bottom: 20px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      align-items: ${config.position === 'right' ? 'flex-end' : 'flex-start'};
      gap: 12px;
    }

    /* 渠道按钮 */
    .contact-channel {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 18px;
      background: white;
      border-radius: 30px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      text-decoration: none;
      color: #333;
      font-weight: 600;
      font-size: 14px;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      opacity: 0;
      transform: translateY(10px) scale(0.8);
      pointer-events: none;
    }

    .contact-channel.show {
      opacity: 1;
      transform: translateY(0) scale(1);
      pointer-events: auto;
    }

    .contact-channel:hover {
      transform: translateY(-3px);
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
    }

    .contact-channel svg {
      width: 24px;
      height: 24px;
      flex-shrink: 0;
    }

    .contact-channel span {
      white-space: nowrap;
    }

    /* WhatsApp */
    .contact-whatsapp {
      background: #25D366;
      color: white;
    }

    .contact-whatsapp:hover {
      background: #20BA5A;
      color: white;
    }

    /* 微信 */
    .contact-wechat {
      background: #07C160;
      color: white;
    }

    .contact-wechat:hover {
      background: #06AD54;
      color: white;
    }

    /* Email */
    .contact-email {
      background: #EA4335;
      color: white;
    }

    .contact-email:hover {
      background: #D93025;
      color: white;
    }

    /* 电话 */
    .contact-phone {
      background: #4285F4;
      color: white;
    }

    .contact-phone:hover {
      background: #3367D6;
      color: white;
    }

    /* 主浮动按钮 */
    .contact-fab-main {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: linear-gradient(135deg, #0b8f8d 0%, #075aa8 100%);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px rgba(11, 143, 141, 0.4);
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      border: none;
      padding: 0;
    }

    .contact-fab-main:hover {
      transform: scale(1.1);
      box-shadow: 0 6px 20px rgba(11, 143, 141, 0.6);
    }

    .contact-fab-main.active {
      background: #e74c3c;
      transform: rotate(45deg);
    }

    .contact-fab-main svg {
      width: 28px;
      height: 28px;
      transition: transform 0.3s ease;
    }

    .contact-fab-main.active svg {
      transform: rotate(-45deg);
    }

    /* 微信二维码弹窗 */
    .wechat-modal {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.7);
      display: none;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      backdrop-filter: blur(4px);
    }

    .wechat-modal.show {
      display: flex;
    }

    .wechat-modal-content {
      background: white;
      padding: 30px;
      border-radius: 16px;
      text-align: center;
      max-width: 90%;
      animation: modalSlideIn 0.3s ease;
    }

    @keyframes modalSlideIn {
      from {
        opacity: 0;
        transform: scale(0.9) translateY(-20px);
      }
      to {
        opacity: 1;
        transform: scale(1) translateY(0);
      }
    }

    .wechat-modal h3 {
      margin: 0 0 20px;
      color: #07C160;
      font-size: 20px;
    }

    .wechat-modal img {
      max-width: 200px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .wechat-modal-close {
      margin-top: 20px;
      padding: 10px 24px;
      background: #07C160;
      color: white;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.3s ease;
    }

    .wechat-modal-close:hover {
      background: #06AD54;
    }

    /* 提示气泡 */
    .contact-tooltip {
      position: absolute;
      ${config.position === 'right' ? 'right' : 'left'}: 70px;
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 13px;
      white-space: nowrap;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.3s ease;
    }

    .contact-channel:hover .contact-tooltip {
      opacity: 1;
    }

    /* 移动端适配 */
    @media (max-width: 768px) {
      .contact-fab-container {
        ${config.position}: 15px;
        bottom: ${config.mobileOffset}px;
      }

      .contact-fab-main {
        width: 56px;
        height: 56px;
      }

      .contact-fab-main svg {
        width: 24px;
        height: 24px;
      }

      .contact-channel {
        padding: 10px 14px;
        font-size: 13px;
      }

      .contact-channel span {
        display: none;
      }

      .contact-channel {
        width: 48px;
        height: 48px;
        padding: 0;
        justify-content: center;
      }

      .wechat-modal-content {
        padding: 20px;
      }

      .wechat-modal img {
        max-width: 160px;
      }
    }

    /* 打印时隐藏 */
    @media print {
      .contact-fab-container,
      .wechat-modal {
        display: none !important;
      }
    }
  `;
  document.head.appendChild(style);

  // 创建 HTML 结构
  function createContactFAB() {
    const container = document.createElement('div');
    container.className = 'contact-fab-container';
    container.innerHTML = `
      ${config.whatsapp.enabled ? `
        <a href="https://wa.me/${config.whatsapp.number}?text=${encodeURIComponent(config.whatsapp.message)}" 
           class="contact-channel contact-whatsapp" 
           target="_blank"
           rel="noopener noreferrer"
           aria-label="Contact us on WhatsApp">
          <svg viewBox="0 0 32 32" fill="currentColor">
            <path d="M16 0c-8.837 0-16 7.163-16 16 0 2.825 0.737 5.607 2.137 8.048l-2.137 7.952 7.933-2.127c2.42 1.37 5.173 2.127 8.067 2.127 8.837 0 16-7.163 16-16s-7.163-16-16-16zM16 29.467c-2.482 0-4.908-0.646-7.07-1.87l-0.507-0.292-4.713 1.262 1.262-4.669-0.292-0.508c-1.207-2.100-1.847-4.507-1.847-6.957 0-7.51 6.11-13.62 13.62-13.62s13.62 6.11 13.62 13.62-6.11 13.62-13.62 13.62zM21.305 19.26c-0.346-0.174-2.049-1.007-2.366-1.123-0.316-0.116-0.547-0.174-0.776 0.174s-0.893 1.123-1.094 1.347c-0.201 0.224-0.402 0.251-0.748 0.076-0.346-0.174-1.461-0.539-2.785-1.722-1.031-0.922-1.727-2.061-1.929-2.407-0.201-0.346-0.022-0.533 0.152-0.707 0.156-0.154 0.346-0.402 0.52-0.603 0.174-0.201 0.231-0.346 0.346-0.571 0.116-0.224 0.058-0.427-0.028-0.603s-0.776-1.87-1.063-2.565c-0.28-0.672-0.56-0.58-0.776-0.591-0.201-0.008-0.428-0.010-0.656-0.010s-0.603 0.085-0.92 0.427c-0.316 0.346-1.206 1.179-1.206 2.873s1.235 3.333 1.406 3.561c0.174 0.224 2.425 3.732 5.872 5.234 0.821 0.354 1.462 0.566 1.962 0.724 0.825 0.262 1.577 0.225 2.168 0.137 0.661-0.099 2.049-0.835 2.335-1.642 0.288-0.807 0.288-1.501 0.201-1.642-0.086-0.14-0.316-0.224-0.662-0.398z"/>
          </svg>
          <span>WhatsApp</span>
        </a>
      ` : ''}

      ${config.wechat.enabled ? `
        <button class="contact-channel contact-wechat" 
                onclick="window.ContactFAB.showWeChatQR()"
                aria-label="Contact us on WeChat">
          <svg viewBox="0 0 32 32" fill="currentColor">
            <path d="M21.6 13.6c0.4 0 0.7 0 1.1 0.1-1-4.7-6.2-8.2-12-8.2-6.7 0-12.1 4.7-12.1 10.5 0 3.4 1.7 6.4 4.4 8.4l-1.1 3.3 3.8-1.9c1.4 0.3 2.6 0.5 4 0.5 0.4 0 0.7 0 1.1-0.1-0.2-0.7-0.4-1.5-0.4-2.3 0-5.3 4.8-9.6 10.7-9.6l0.5 0.3zM7.1 11.2c-0.8 0-1.5-0.7-1.5-1.5s0.7-1.5 1.5-1.5 1.5 0.7 1.5 1.5-0.7 1.5-1.5 1.5zM15.1 11.2c-0.8 0-1.5-0.7-1.5-1.5s0.7-1.5 1.5-1.5 1.5 0.7 1.5 1.5-0.7 1.5-1.5 1.5zM32 21.9c0-4.9-4.8-8.9-10.7-8.9s-10.7 4-10.7 8.9 4.8 8.9 10.7 8.9c1.1 0 2.2-0.1 3.2-0.4l3.2 1.6-0.9-2.8c2.3-1.7 3.7-4.2 3.7-6.9l1.5-0.4zM18.7 20.4c-0.6 0-1.1-0.5-1.1-1.1s0.5-1.1 1.1-1.1 1.1 0.5 1.1 1.1-0.5 1.1-1.1 1.1zM24.8 20.4c-0.6 0-1.1-0.5-1.1-1.1s0.5-1.1 1.1-1.1 1.1 0.5 1.1 1.1-0.5 1.1-1.1 1.1z"/>
          </svg>
          <span>微信</span>
        </button>
      ` : ''}

      ${config.email.enabled ? `
        <a href="mailto:${config.email.address}?subject=${encodeURIComponent(config.email.subject)}" 
           class="contact-channel contact-email"
           aria-label="Send us an email">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
            <polyline points="22,6 12,13 2,6"/>
          </svg>
          <span>Email</span>
        </a>
      ` : ''}

      ${config.phone.enabled ? `
        <a href="tel:${config.phone.number}" 
           class="contact-channel contact-phone"
           aria-label="Call us">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
          </svg>
          <span>${config.phone.display}</span>
        </a>
      ` : ''}

      <button class="contact-fab-main" aria-label="Toggle contact options">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
      </button>
    `;

    document.body.appendChild(container);

    // 微信二维码弹窗
    if (config.wechat.enabled) {
      const modal = document.createElement('div');
      modal.className = 'wechat-modal';
      modal.innerHTML = `
        <div class="wechat-modal-content">
          <h3>扫描二维码添加微信</h3>
          <img src="${config.wechat.qrcode}" alt="WeChat QR Code" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22200%22><rect fill=%22%23f0f0f0%22 width=%22200%22 height=%22200%22/><text x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22 font-family=%22Arial%22 font-size=%2216%22 fill=%22%23999%22>微信二维码</text></svg>'">
          <button class="wechat-modal-close" onclick="window.ContactFAB.closeWeChatQR()">关闭</button>
        </div>
      `;
      document.body.appendChild(modal);

      // 点击背景关闭
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          window.ContactFAB.closeWeChatQR();
        }
      });
    }

    return container;
  }

  // 初始化
  function init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
      return;
    }

    const fab = createContactFAB();
    const mainBtn = fab.querySelector('.contact-fab-main');
    const channels = fab.querySelectorAll('.contact-channel');
    let isOpen = false;

    // 切换展开/收起
    mainBtn.addEventListener('click', () => {
      isOpen = !isOpen;
      mainBtn.classList.toggle('active', isOpen);

      channels.forEach((channel, index) => {
        if (isOpen) {
          setTimeout(() => {
            channel.classList.add('show');
          }, index * 50);
        } else {
          setTimeout(() => {
            channel.classList.remove('show');
          }, (channels.length - index - 1) * 50);
        }
      });
    });

    // 全局对象
    window.ContactFAB = {
      showWeChatQR() {
        const modal = document.querySelector('.wechat-modal');
        if (modal) {
          modal.classList.add('show');
          document.body.style.overflow = 'hidden';
        }
      },
      closeWeChatQR() {
        const modal = document.querySelector('.wechat-modal');
        if (modal) {
          modal.classList.remove('show');
          document.body.style.overflow = '';
        }
      }
    };

    // ESC 键关闭微信弹窗
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && document.querySelector('.wechat-modal.show')) {
        window.ContactFAB.closeWeChatQR();
      }
    });

    console.log('Contact FAB initialized');
  }

  init();

})();
