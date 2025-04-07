// components/Modal.js
import React from 'react';
//import styles from './Modal.module.css'; // Create a CSS module for styling

const Modal = ({ isOpen, onClose, children }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className='modalOverlay'>
      <div className='modalContent'>
        <button className='closeButton' onClick={onClose}>
          &times;
        </button>
        {children}
      </div>
    </div>
  );
};

export default Modal;