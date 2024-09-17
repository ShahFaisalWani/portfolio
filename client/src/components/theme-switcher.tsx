import { useTheme, Theme } from '@providers/theme-provider';
import { useState } from "react";

export const ThemeSwitcher = () => {
  const { theme, changeTheme } = useTheme();
  const [isChecked, setIsChecked] = useState(theme === Theme.Dark);

  const addTransitionClassName = () => {
    document.body.classList.add('theme-transition');
  };

  const removeTransitionClassName = () => {
    document.body.classList.remove('theme-transition');
  };

  const toggleTheme = () => {
    const newTheme = isChecked ? Theme.Light : Theme.Dark;
    setIsChecked(!isChecked);
    addTransitionClassName();
    changeTheme(newTheme);

    setTimeout(removeTransitionClassName, parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--trans-dur')) * 1000);
  };

  return (
    <label className="switch">
      <input
        className="switch__input"
        type="checkbox"
        role="switch"
        checked={isChecked}
        onChange={toggleTheme}
      />
      <span className="switch__icon">
        <span className="switch__icon-part switch__icon-part--1"></span>
        <span className="switch__icon-part switch__icon-part--2"></span>
        <span className="switch__icon-part switch__icon-part--3"></span>
        <span className="switch__icon-part switch__icon-part--4"></span>
        <span className="switch__icon-part switch__icon-part--5"></span>
        <span className="switch__icon-part switch__icon-part--6"></span>
        <span className="switch__icon-part switch__icon-part--7"></span>
        <span className="switch__icon-part switch__icon-part--8"></span>
        <span className="switch__icon-part switch__icon-part--9"></span>
        <span className="switch__icon-part switch__icon-part--10"></span>
        <span className="switch__icon-part switch__icon-part--11"></span>
      </span>
      <span className="switch__sr">Dark Mode</span>
    </label>
  );
};
