import React from 'react';

interface ImgMagnifierProps {
  images: string[];
}

const ImgMagnifier: React.FC<ImgMagnifierProps> = ({ images }) => {
  return (
    <div className="image-magnifier-container">
      {images.map((image, index) => (
        <img key={index} src={image} alt={`Image ${index + 1}`} />
      ))}
    </div>
  );
};

export default ImgMagnifier;
