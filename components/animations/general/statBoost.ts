
export const STAT_BOOST_CSS = `
@keyframes stat-boost-anim {
    0% { transform: translateY(50%) scale(0.5); opacity: 0; }
    20% { opacity: 1; transform: translateY(0) scale(1.2); }
    80% { opacity: 1; transform: translateY(-100%) scale(1.2); }
    100% { transform: translateY(-150%) scale(1.5); opacity: 0; }
}

.anim-stat-boost {
    position: absolute;
    left: -50%;
    right: -50%;
    bottom: 0;
    height: 100%;
    pointer-events: none;
    z-index: 100;
    overflow: visible;
    display: flex;
    align-items: flex-end;
    justify-content: center;
}

.anim-stat-boost::after {
    content: '▲ ▲ ▲';
    display: block;
    color: #4ade80; /* green-400 */
    font-size: 1.8rem;
    font-weight: 900;
    /* Heavy black outline for contrast against any background */
    text-shadow: 
        2px 2px 0 #000,
        -1px -1px 0 #000,  
        1px -1px 0 #000,
        -1px 1px 0 #000,
        1px 1px 0 #000,
        0 0 10px rgba(74, 222, 128, 0.9);
    animation: stat-boost-anim 2s ease-out forwards;
    letter-spacing: 5px;
    line-height: 1;
    white-space: nowrap;
}
`;

export const getStatBoostAnimation = () => {
    return { className: 'anim-stat-boost' };
};
