import React from 'react';
import { Link, useParams } from 'react-router-dom';

const diseasesData = {
    'rice-blast': {
        title: 'Rice Blast (Magnaporthe oryzae)',
        crop: 'Paddy',
        type: 'Fungal Disease',
        image: '/images/Rice.png',
        symptoms: [
            'Small, bluish-green spots on leaves that enlarge into diamond-shaped lesions.',
            'Lesions have greyish-white centers and reddish-brown margins.',
            'Infection on the neck of the panicle causes the "neck blast" phase, leading to grain failure.',
            'Severe leaf infection leads to leaf death and stunting of the plant.'
        ],
        prevention: [
            'Use resistant varieties adapted to your local agro-climatic conditions.',
            'Avoid excessive use of nitrogenous fertilizers, as high nitrogen promotes infection.',
            'Maintain a clean field by removing infected straw and alternative weed hosts.',
            'Optimize planting density to improve airflow and reduce humidity in the canopy.'
        ],
        treatment: 'At the first sign of leaf blast or before the panicle emergence stage, apply recommended systemic fungicides like Tricyclazole or Propiconazole. Ensure thorough coverage of the foliage. In organic farming settings, seed treatment with Pseudomonas fluorescens and foliar spray of neem-based products can help manage early infestations.'
    },
    'early-blight': {
        title: 'Early Blight (Alternaria solani)',
        crop: 'Tomato',
        type: 'Fungal Disease',
        image: '/images/tomato.jpg',
        symptoms: [
            'Small brown spots on older leaves that develop concentric rings (target-like appearance).',
            'Foliage yellowing around lesions, eventually leading to leaf drop.',
            'Sunken, leathery dark spots on the stem end of fruits.',
            'Stem lesions near the soil line (collar rot) in young seedlings.'
        ],
        prevention: [
            'Use high-quality, disease-free seeds and certified transplants.',
            'Practice a 3-year crop rotation without Solanaceous crops (potato, pepper, eggplant).',
            'Ensure proper spacing between plants for adequate air circulation.',
            'Avoid overhead irrigation to keep leaves dry; use drip irrigation if possible.'
        ],
        treatment: 'Remove infected lower leaves immediately to reduce spore spread. Apply fungicides containing chlorothalonil, copper-based sprays, or mancozeb every 7-10 days if environmental conditions favor the disease. Mulching around the base of plants can prevent soil-borne spores from splashing onto lower leaves.'
    },
    'papaya-ringspot': {
        title: 'Papaya Ringspot Virus (PRSV)',
        crop: 'Papaya',
        type: 'Viral Disease (Aphid-borne)',
        image: '/images/papaya.jpg',
        symptoms: [
            'Yellowing and vein clearing in young leaves, followed by severe mosaic or mottling.',
            'Leaves often become distorted, narrowed, and "shoe-stringed".',
            'Dark green "water-soaked" streaks on stems and petioles.',
            'Distinctive circular C-shaped rings or spots on the fruit skin.'
        ],
        prevention: [
            'Eradicate and destroy infected trees immediately to prevent further spread.',
            'Intercrop with non-host plants like corn or sorghum to confuse aphid vectors.',
            'Use PRSV-resistant varieties (like SunUp or Rainbow) if available in your region.',
            'Control aphid populations using insecticidal soaps or neem oil during early growth stages.'
        ],
        treatment: 'There is no chemical cure for the virus itself. Management focus must be on preventing transmission through aphid control and removing any source of infection from the field. Providing optimal nutrition and water can help infected trees maintain some productivity, but they will remain a permanent source of inoculum.'
    }
};

const DiseaseDetail = () => {
    const { id } = useParams();
    const disease = diseasesData[id] || diseasesData['rice-blast']; // Fallback to Rice Blast if id not found

    const containerStyle = {
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '20px',
        fontFamily: '"Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        color: '#333',
    };

    const navStyle = {
        marginBottom: '20px',
    };

    const backButtonStyle = {
        display: 'inline-flex',
        alignItems: 'center',
        padding: '10px 20px',
        backgroundColor: '#f1f1f1',
        color: '#333',
        textDecoration: 'none',
        borderRadius: '8px',
        fontWeight: '600',
        transition: 'background-color 0.2s',
    };

    const bannerStyle = {
        width: '100%',
        height: '400px',
        objectFit: 'cover',
        borderRadius: '12px',
        marginBottom: '30px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
    };

    const headerStyle = {
        marginBottom: '40px',
    };

    const titleStyle = {
        fontSize: '48px',
        fontWeight: '800',
        color: '#1a472a',
        margin: '0 0 15px 0',
    };

    const badgeContainerStyle = {
        display: 'flex',
        gap: '10px',
    };

    const badgeStyle = {
        padding: '6px 16px',
        borderRadius: '20px',
        fontSize: '14px',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        backgroundColor: '#e8f5e9',
        color: '#2e7d32',
        border: '1px solid #c8e6c9',
    };

    const contentGridStyle = {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
        gap: '40px',
        marginBottom: '40px',
    };

    const sectionStyle = {
        padding: '25px',
        backgroundColor: '#f8faf9',
        borderRadius: '12px',
        border: '1px solid #edf2ef',
    };

    const sectionTitleStyle = {
        fontSize: '24px',
        fontWeight: '700',
        color: '#2d5a27',
        marginBottom: '20px',
        borderBottom: '2px solid #e1e8e3',
        paddingBottom: '10px',
    };

    const listStyle = {
        margin: '0',
        paddingLeft: '20px',
        lineHeight: '1.6',
    };

    const listItemStyle = {
        marginBottom: '10px',
    };

    const treatmentSectionStyle = {
        ...sectionStyle,
        gridColumn: '1 / -1',
        backgroundColor: '#e3f2fd',
        borderColor: '#bbdefb',
    };

    const treatmentTitleStyle = {
        ...sectionTitleStyle,
        color: '#1565c0',
        borderColor: '#90caf9',
    };

    const treatmentTextStyle = {
        fontSize: '18px',
        lineHeight: '1.8',
        color: '#0d47a1',
        margin: '0',
    };

    return (
        <div className="about fadeIn" style={containerStyle}>
            <nav style={navStyle}>
                <Link to="/knowledge" style={backButtonStyle}>
                    ← Back to Dashboard
                </Link>
            </nav>

            <img
                src={disease.image}
                alt={`${disease.title} Banner`}
                style={bannerStyle}
            />

            <div style={headerStyle}>
                <h1 style={titleStyle}>{disease.title}</h1>
                <div style={badgeContainerStyle}>
                    <span style={badgeStyle}>Crop: {disease.crop}</span>
                    <span style={badgeStyle}>Type: {disease.type}</span>
                </div>
            </div>

            <div style={contentGridStyle}>
                <div style={sectionStyle}>
                    <h2 style={sectionTitleStyle}>Symptoms</h2>
                    <ul style={listStyle}>
                        {disease.symptoms.map((s, idx) => (
                            <li key={idx} style={listItemStyle}>{s}</li>
                        ))}
                    </ul>
                </div>

                <div style={sectionStyle}>
                    <h2 style={sectionTitleStyle}>Prevention</h2>
                    <ul style={listStyle}>
                        {disease.prevention.map((p, idx) => (
                            <li key={idx} style={listItemStyle}>{p}</li>
                        ))}
                    </ul>
                </div>

                <div style={treatmentSectionStyle}>
                    <h2 style={treatmentTitleStyle}>Treatment Plan</h2>
                    <p style={treatmentTextStyle}>
                        {disease.treatment}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default DiseaseDetail;
