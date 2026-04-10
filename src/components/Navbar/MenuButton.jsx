const MenuButton = ({ toggleMenu }) => {
  return (
    <div onClick={toggleMenu} className="menu flex flex-col items-center cursor-pointer">
      <div className="menuBar h-1.5 w-40 bg-white rounded-full cursor-pointer"></div>
      <button className=" cursor-pointer ">MENU</button>
    </div>
  );
};

export default MenuButton;