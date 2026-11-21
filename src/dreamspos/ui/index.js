// Bộ thành phần DreamsPOS của trang quản trị.
// Các trang nhập thành phần từ đây thay cho "@mui/material": những thành phần giao diện (nút, thẻ,
// nhãn, ô nhập, bảng, hộp thoại, tab, phân trang…) được dựng bằng markup Bootstrap/DreamsPOS;
// phần còn lại (Box, Stack, Grid, Typography, Tooltip, Menu, Autocomplete…) vẫn lấy từ MUI.
// Muốn trả một thành phần về bản MUI: xoá dòng export tương ứng bên dưới.
export * from "@mui/material";

export { Button, Fab, IconButton, ToggleButton, ToggleButtonGroup } from "./buttons";
export {
  Card,
  CardContent,
  CardActions,
  CardHeader,
  Paper,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "./surfaces";
export {
  Chip,
  Alert,
  AlertTitle,
  CircularProgress,
  LinearProgress,
  Skeleton,
  Avatar,
} from "./feedback";
export {
  TextField,
  InputAdornment,
  Select,
  FormControl,
  InputLabel,
  FormHelperText,
  Switch,
  Checkbox,
  Radio,
  FormControlLabel,
} from "./forms";
export { Dialog, DialogTitle, DialogContent, DialogActions, DialogContentText } from "./dialog";
export {
  Table,
  TableContainer,
  TableHead,
  TableBody,
  TableFooter,
  TableRow,
  TableCell,
  Pagination,
  Tabs,
  Tab,
} from "./table";
