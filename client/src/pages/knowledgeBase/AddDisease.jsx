import React from 'react';

const AddDisease = () => {
    const containerStyle = {
        maxWidth: '800px',
        margin: '50px auto',
        padding: '40px',
        borderRadius: '12px',
        boxShadow: '0 10px 25px rgba(0,0,0,0.05)',
        fontFamily: '"Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        color: '#333'
    };

    const headerStyle = {
        fontSize: '28px',
        fontWeight: '700',
        color: '#2c3e50',
        marginBottom: '30px',
        textAlign: 'center',
        borderBottom: '2px solid #f1f4f8',
        paddingBottom: '15px'
    };

    const sectionStyle = {
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
    };

    const fieldStyle = {
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
    };

    const labelStyle = {
        fontSize: '14px',
        fontWeight: '600',
        color: '#5d6d7e',
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
    };

    const inputStyle = {
        padding: '12px 16px',
        borderRadius: '8px',
        border: '1px solid #d5dbdb',
        fontSize: '16px',
        outline: 'none',
        transition: 'border-color 0.2s',
        backgroundColor: '#f8f9f9'
    };

    const textareaStyle = {
        ...inputStyle,
        minHeight: '120px',
        resize: 'vertical',
        lineHeight: '1.5'
    };

    const buttonStyle = {
        backgroundColor: '#27ae60',
        color: 'white',
        padding: '16px',
        borderRadius: '8px',
        border: 'none',
        fontSize: '18px',
        fontWeight: '600',
        cursor: 'pointer',
        marginTop: '20px',
        transition: 'background-color 0.2s, transform 0.1s',
        boxShadow: '0 4px 6px rgba(39, 174, 96, 0.2)'
    };

    return (
        <div className="about fadeIn" style={containerStyle}>
            <h2 style={headerStyle}>Add Disease Information</h2>
            <form style={sectionStyle} onSubmit={(e) => e.preventDefault()}>
                <div style={fieldStyle}>
                    <label style={labelStyle}>Crop Type</label>
                    <select style={inputStyle}>
                        <option value="">Select Crop...</option>
                        <option value="Paddy">Paddy</option>
                        <option value="Tomato">Tomato</option>
                        <option value="Papaya">Papaya</option>
                    </select>
                </div>

                <div style={fieldStyle}>
                    <label style={labelStyle}>Disease Name</label>
                    <input
                        type="text"
                        placeholder="e.g. Early Blight"
                        style={inputStyle}
                    />
                </div>

                <div style={fieldStyle}>
                    <label style={labelStyle}>Article Title</label>
                    <input
                        type="text"
                        placeholder="e.g. Managing Early Blight in Tomato Crops"
                        style={inputStyle}
                    />
                </div>

                <div style={fieldStyle}>
                    <label style={labelStyle}>Symptoms</label>
                    <textarea
                        placeholder="List the key identification signs..."
                        style={textareaStyle}
                    ></textarea>
                </div>

                <div style={fieldStyle}>
                    <label style={labelStyle}>Prevention Methods</label>
                    <textarea
                        placeholder="Describe cultural and chemical prevention strategies..."
                        style={textareaStyle}
                    ></textarea>
                </div>

                <div style={fieldStyle}>
                    <label style={labelStyle}>Reference Image</label>
                    <input
                        type="file"
                        style={{ ...inputStyle, padding: '10px' }}
                    />
                </div>

                <button type="submit" style={buttonStyle}>
                    Publish Disease Info
                </button>
            </form>
        </div>
    );
};

export default AddDisease;
