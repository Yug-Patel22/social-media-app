import { useState } from "react";

export default function CreateMedia({ title, onSubmit, fieldName = "image" }) {
  const [caption, setCaption] = useState("");
  const [file, setFile] = useState(null);

  const submit = (e) => {
    e.preventDefault();
    if (!file) return;
    onSubmit({ file, caption, fieldName });
    setCaption("");
    setFile(null);
    e.target.reset();
  };

  return (
    <form className="card form-stack" onSubmit={submit}>
      <h3>{title}</h3>
      <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files[0])} required />
      <input value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Caption (optional)" />
      <button type="submit">Upload</button>
    </form>
  );
}
