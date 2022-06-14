import React from 'react';
import { slide as Menu } from 'react-burger-menu';

function Sidebar() {
  return (
    <Menu>
      <a className="Home" href="/">홈</a>
      <a className="score" href="/score">기록</a>
      <a className="login" href="/login">로그인</a>
      <a className="register" href="/register">회원가입</a>
    </Menu>
  );

}
export default Sidebar