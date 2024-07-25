import { useCallback, useEffect, useState } from "react";
import { RxCross2 } from "react-icons/rx";
// import { Link } from "react-router-dom";

// eslint-disable-next-line react/prop-types
export const ImageDisplay = ({ image,setFiles,index }) => {
  const [imageUrl, setImageUrl] = useState(null);
  const [hover, setHover] = useState(false)
  const [hover2, setHover2] = useState(false)

  const handleDeleteImages = useCallback(
    (index) => {
        setFiles((prevImages) => prevImages.filter((_, i) => i !== index));
      
    },
    [setFiles]
  );

  useEffect(() => {
    if (image) {
      const url = URL?.createObjectURL(image);
      setImageUrl(url);

      return () => {
        URL.revokeObjectURL(url);
      };
    }
  }, [image]);

  if (!imageUrl) return null;

  return (
    <section className="images__container" onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}>
      <img
        src={imageUrl}
        alt={"img"}
        loading="lazy"
        style={{ width: "40vw", height: "40vh",objectFit: "cover" }}
        className={`${hover2 ? "image__active" : "fImage"}`}
      />
      <i className="deleteImages" onMouseEnter={() => setHover2(true)}
        onMouseLeave={() => setHover2(false)}>
        {hover && <RxCross2
          onClick={() => handleDeleteImages(index)}
        />}
      </i>
      {/* <Link className="uploadView__eye" to={imageUrl} target="_blank"></Link> */}
    </section>
  );
};
