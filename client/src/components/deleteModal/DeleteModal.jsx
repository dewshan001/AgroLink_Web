import "./deleteModal.css";
import { useContext } from "react";
import { Context } from "../../context/Context";
import axios from "axios";

export default function DeleteModal() {
  const { user, dispatch } = useContext(Context);

  const handleDelete = async () => {
    try {
      await axios.delete(`/users/${user._id}`, {
        data: { userId: user._id },
      });
      dispatch({ type: "LOGOUT" });
      dispatch({ type: "HIDE_DMODAL" });
      window.location.replace("/");
    } catch (err) {
      console.log(err);
      dispatch({ type: "HIDE_DMODAL" });
    }
  };

  return (
    <div className="deleteModalContainer">
      <div className="deleteModalBackdrop" onClick={() => dispatch({ type: "HIDE_DMODAL" })}></div>
      <div className="deleteModalWrapper fadeIn">
        <button className="deleteModalClose" onClick={() => dispatch({ type: "HIDE_DMODAL" })}>
          <i className="fas fa-times"></i>
        </button>
        <div className="deleteModalHeader">
          <div className="deleteModalIcon">
            <i className="fas fa-exclamation-triangle"></i>
          </div>
          <h1 className="deleteModalTitle">Delete Account?</h1>
          <p className="deleteModalDesc">
            Are you sure you want to delete your account? This action cannot be undone.
          </p>
        </div>
        <div className="deleteModalButtons">
          <button className="deleteModalConfirm" onClick={handleDelete}>
            Delete
          </button>
          <button className="deleteModalCancel" onClick={() => dispatch({ type: "HIDE_DMODAL" })}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
