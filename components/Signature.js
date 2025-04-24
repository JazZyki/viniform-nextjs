'use client';

import React, { useRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';

const SignaturePadOnly = () => {
  const signatureRef = useRef(null);

  const logSignature = () => {
    if (signatureRef.current) {
      const dataUrl = signatureRef.current.toDataURL();
      console.log("Base64 Data URL:", dataUrl);
      alert(dataUrl); // You can remove this if you want
    }
  };

  const clearSignature = () => {
    if (signatureRef.current) {
      signatureRef.current.clear();
    }
  };

  return (
    <div>
      <SignatureCanvas
        ref={signatureRef}
        penColor='black'
        canvasProps={{  className: 'sigCanvas' }}
      />
      <button onClick={logSignature}>Log Signature</button>
      <button onClick={clearSignature}>Clear Signature</button>
    </div>
  );
};

export default SignaturePadOnly;