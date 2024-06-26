import React, { useState, useEffect, useContext } from "react";
import { useParams } from "react-router-dom";
import Layout from "../components/Layout";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Button from "react-bootstrap/Button";
import Alert from "react-bootstrap/Alert";
import { Form } from "react-bootstrap";
import styles from "./NewsDetails.module.css";
import "./NewsDetails.css";
import { FavoritesContext } from "../store/favorites/context";
import {jwtDecode} from "jwt-decode";
import { format } from "date-fns";
import Pagination from "../components/Pagination";
import RelatedNews from "../components/RelatedNews"; // Import Pagination component

function NewsDetails() {
  const { newsId } = useParams();
  const { dispatch } = useContext(FavoritesContext);

  const [news, setNews] = useState(null);
  const [isAlertDisplayed, setIsAlertDisplayed] = useState(false);
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const commentsPerPage = 6;

  useEffect(() => {
    const fetchNewsData = async () => {
      try {
        const response = await fetch(`http://localhost:7000/api/news/${newsId}`);
        if (!response.ok) {
          throw new Error("Không thể tìm nạp dữ liệu tin tức");
        }
        const data = await response.json();
        setNews(data);
      } catch (error) {
        console.error("Lỗi khi tìm nạp dữ liệu tin tức:", error);
      }
    };

    const fetchComments = async () => {
      try {
        const response = await fetch(`http://localhost:7000/api/comments/${newsId}`);
        if (!response.ok) {
          throw new Error("Không tìm nạp được nhận xét");
        }
        const data = await response.json();
        setComments(data);
      } catch (error) {
        console.error("Lỗi khi tìm nạp nhận xét:", error);
      }
    };

    fetchNewsData();
    fetchComments();
  }, [newsId]);


  const handleAddToFavorites = () => {
    dispatch({ type: "ADD_TO_FAVORITES", payload: news });
    setIsAlertDisplayed(true);
    setTimeout(() => setIsAlertDisplayed(false), 3000);
  };


  const handleSubmitComment = async () => {
    try {
      const token = localStorage.getItem("token");

      // Giải mã token để lấy thông tin người dùng
      const decodedToken = jwtDecode(token);
      const userId = decodedToken.userId; // Điều chỉnh theo cấu trúc của token của bạn

      console.log('Gửi bình luận với nội dung:', comment, 'cho ID tin tức:', newsId, 'bởi user:', userId);

      const response = await fetch("http://localhost:7000/api/comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // Đảm bảo bạn đã lưu token sau khi đăng nhập
        },
        body: JSON.stringify({ content: comment, newsId, userId }), // Thêm userId vào body
      });

      if (!response.ok) {
        throw new Error("Không gửi được bình luận:");
      }

      const newComment = await response.json();
      // Cập nhật danh sách bình luận và sắp xếp lại
      setComments((prevComments) => {
        const updatedComments = [newComment, ...prevComments];
        return updatedComments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      });
      setComment("");
    } catch (error) {
      console.error("Lỗi gửi bình luận:", error);
    }
  };

  const indexOfLastComment = currentPage * commentsPerPage;
  const indexOfFirstComment = indexOfLastComment - commentsPerPage;
  const currentComments = comments.slice(indexOfFirstComment, indexOfLastComment);

  if (!news) {
    return <p>Loading...</p>;
  }

  const { title, author, dateTime,type, mainText, imgLinks } = news;

  return (
      <Layout>
        {isAlertDisplayed && (
            <Alert variant="success" id={styles.alert}>
              Tin tức đã được lưu vào mục ƯA THÍCH
            </Alert>
        )}
        <Container className="NewsDetails my-5" style={{ paddingLeft: "150px", paddingRight: "150px" }}>
          <Row className="justify-content-center">
            <Col md={8}>
              <Row className="mb-3">
                <Col className="text-left text-muted">{type}</Col>
                <Col className="text-right text-muted" style={{textAlign: "right"}}>{dateTime}</Col>
              </Row>
              <h1 className="pt-3 mb-4">{title}</h1>
              <p className="text-muted mb-3"><strong>{author}</strong></p>
              {imgLinks && imgLinks.length > 0 && (
                  <div className="mb-5">
                    <img src={imgLinks[0].url} alt={imgLinks[0].title} className="img-fluid mb-3" />
                    <p className="text-center text-muted">{imgLinks[0].title}</p>
                  </div>
              )}
              {mainText.map((paragraph, index) => (
                  <React.Fragment key={index}>
                    <p className="mb-3">{paragraph}</p>
                    {index === 1 && imgLinks && imgLinks.length > 1 && (
                        <div className="mb-5">
                          <img src={imgLinks[1].url} alt={imgLinks[1].title} className="img-fluid mb-3" />
                          <p className="text-center text-muted">{imgLinks[1].title}</p>
                        </div>
                    )}
                  </React.Fragment>
              ))}
              <Button onClick={handleAddToFavorites} className="mt-4">Thêm vào mục ƯA THÍCH</Button>
              <div className="comment-form mt-4">
                <h5>Để lại bình luận của bạn</h5>
                <Form>
                  <Form.Group controlId="commentForm.ControlTextarea">
                    <Form.Label>Nhập bình luận của bạn</Form.Label>
                    <Form.Control
                        as="textarea"
                        rows={3}
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                    />
                  </Form.Group>
                  <Button variant="primary" onClick={handleSubmitComment} className="mt-2">
                    Gửi bình luận
                  </Button>
                </Form>
              </div>
              <div className="comments-section mt-5">
                <h3>Bình luận</h3>
                {currentComments.length > 0 ? (
                    currentComments.map((comment, index) => (
                        <div key={index} className="comment mb-3">
                          <div className="comment-header d-flex align-items-center">
                            <div className="comment-author ms-2">
                              <strong>{comment.author.username}</strong>
                              <small className="text-muted ms-2">{format(new Date(comment.createdAt), "dd/MM/yyyy, hh:mm:ss a")}</small>
                            </div>
                          </div>
                          <div className="comment-body mt-2">
                            <p>{comment.content}</p>
                          </div>
                        </div>
                    ))
                ) : (
                    <p>Chưa có bình luận nào.</p>
                )}
              </div>
              <Pagination
                  itemsPerPage={commentsPerPage}
                  totalItems={comments.length}
                  currentPage={currentPage}
                  paginate={setCurrentPage}
              />
            </Col>
            <Col md={4} style={{ paddingTop: 125 }}>
              <RelatedNews type={type} />
            </Col>
          </Row>
        </Container>
      </Layout>
  );
}

export default NewsDetails;
