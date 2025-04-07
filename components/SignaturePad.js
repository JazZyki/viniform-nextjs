// components/SignaturePadComponent.js
import React, { useRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';

const SignaturePadComponent = ({ onSave }) => {
  const signaturePad = useRef();

  const handleSave = () => {
    if (signaturePad.current) {
      const dataURL = signaturePad.current.toDataURL();
      if (onSave) {
        onSave(dataURL);
      }
    }
  };

  const handleClear = () => {
    if (signaturePad.current) {
      signaturePad.current.clear();
    }
  };

  return (
    <div>
      <SignatureCanvas
        ref={signaturePad}
        penColor="black"
        canvasProps={{
          width: 300,
          height: 150,
          className: 'sigCanvas',
          style: { border: '1px solid #ccc', width: '100%' },
        }}
      />
      <button onClick={handleSave}>Save Signature</button>
      <button onClick={handleClear}>Clear</button>
    </div>
  );
};

export default SignaturePadComponent;