// Lớp phủ kiểu dáng DreamsPOS cho các thành phần MUI có sẵn của trang quản trị.
// Mọi trang (viết bằng MUI / Material Dashboard) nhờ đó mang cùng diện mạo với khung DreamsPOS:
// thẻ viền mảnh bo 6px, nút phẳng màu cam, ô nhập viền xám, bảng đầu nền nhạt, tab gạch chân.
// Bảng màu lấy từ assets/dreamspos/css/style.css của theme.
export const DP = {
  light: {
    primary: "#FF9F43",
    primaryDark: "#FE820E",
    bg: "#FAFBFE",
    card: "#FFFFFF",
    border: "#E8EBED",
    fieldBorder: "#E9ECEF",
    text: "#212B36",
    sub: "#637381",
    head: "#FAFBFE",
    hover: "rgba(255, 159, 67, 0.08)",
    shadow: "0 4px 14px rgba(27, 40, 80, 0.08)",
  },
  dark: {
    primary: "#FF9F43",
    primaryDark: "#FE820E",
    bg: "#141432",
    card: "#1D1D42",
    border: "#353570",
    fieldBorder: "#353570",
    text: "#E4E7F5",
    sub: "#97A2D2",
    head: "#1D1D42",
    hover: "rgba(255, 159, 67, 0.12)",
    shadow: "0 6px 18px rgba(0, 0, 0, 0.35)",
  },
};

export const DP_FONT = '"Nunito", "Roboto", "Helvetica", "Arial", sans-serif';

export function dreamsposPalette(mode) {
  const c = DP[mode];
  return {
    background: { default: c.bg, paper: c.card },
    text: { primary: c.text, secondary: c.sub, disabled: mode === "dark" ? "#6B74A8" : "#B8BCC9" },
    divider: c.border,
    action: { hover: c.hover },
  };
}

export function dreamsposComponents(mode) {
  const c = DP[mode];
  return {
    MuiCssBaseline: {
      styleOverrides: {
        body: { fontFamily: DP_FONT, backgroundColor: c.bg, color: c.text, fontSize: 14 },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          border: `1px solid ${c.border}`,
          boxShadow: "none",
          backgroundColor: c.card,
          backgroundImage: "none",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: "none" },
        rounded: { borderRadius: 6 },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          borderRadius: 5,
          fontWeight: 700,
          fontSize: 14,
          letterSpacing: 0,
          boxShadow: "none",
          "&:hover": { boxShadow: "none" },
          "&:focus:not(:hover)": { boxShadow: "none" },
        },
      },
    },
    MuiIconButton: { styleOverrides: { root: { borderRadius: 6 } } },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 5,
          fontSize: 14,
          backgroundColor: mode === "dark" ? c.bg : c.card,
          "& .MuiOutlinedInput-notchedOutline": { borderColor: c.fieldBorder },
          "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: c.primary },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: c.primary,
            borderWidth: 1,
          },
        },
        input: { color: c.text },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: { color: c.sub, fontSize: 14, "&.Mui-focused": { color: c.primary } },
      },
    },
    MuiFormLabel: {
      styleOverrides: { root: { color: c.text, "&.Mui-focused": { color: c.primary } } },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          backgroundImage: "none !important",
          backgroundColor: c.border,
          borderColor: c.border,
          opacity: 1,
          height: 1,
        },
      },
    },
    MuiTableContainer: { styleOverrides: { root: { boxShadow: "none", borderRadius: 6 } } },
    MuiTableHead: { styleOverrides: { root: { backgroundColor: c.head } } },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: `1px solid ${c.fieldBorder}`,
          fontSize: 14,
          color: c.sub,
          padding: "10px 12px",
        },
        head: {
          color: c.text,
          fontWeight: 600,
          fontSize: 14,
          textTransform: "none",
          letterSpacing: 0,
          backgroundColor: c.head,
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: {
          backgroundColor: "transparent",
          borderRadius: 0,
          padding: 0,
          minHeight: 44,
          borderBottom: `1px solid ${c.border}`,
        },
        indicator: {
          height: 3,
          borderRadius: 0,
          backgroundColor: c.primary,
          boxShadow: "none",
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 600,
          fontSize: 14,
          minHeight: 44,
          borderRadius: 0,
          color: `${c.sub} !important`,
          "&.Mui-selected": { color: `${c.primary} !important` },
        },
      },
    },
    MuiChip: { styleOverrides: { root: { borderRadius: 5, fontWeight: 600 } } },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 6,
          boxShadow: c.shadow,
          backgroundColor: c.card,
          backgroundImage: "none",
        },
      },
    },
    MuiDialogTitle: { styleOverrides: { root: { fontWeight: 700, fontSize: 18, color: c.text } } },
    MuiMenu: {
      styleOverrides: {
        paper: {
          borderRadius: "6px !important",
          border: `1px solid ${c.border}`,
          boxShadow: `${c.shadow} !important`,
          backgroundColor: `${c.card} !important`,
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          fontSize: 14,
          borderRadius: 5,
          color: c.text,
          "&:hover, &.Mui-selected, &.Mui-selected:hover": {
            backgroundColor: c.hover,
            color: c.primary,
          },
        },
      },
    },
    MuiPopover: { styleOverrides: { paper: { borderRadius: 6, boxShadow: c.shadow } } },
    MuiTooltip: { styleOverrides: { tooltip: { borderRadius: 5, fontSize: 12, fontWeight: 600 } } },
    MuiAlert: { styleOverrides: { root: { borderRadius: 6 } } },
    MuiAccordion: {
      styleOverrides: {
        root: {
          border: `1px solid ${c.border}`,
          boxShadow: "none",
          borderRadius: 6,
          "&:before": { display: "none" },
        },
      },
    },
    // Bảng @mui/x-data-grid
    MuiDataGrid: {
      styleOverrides: {
        root: {
          border: `1px solid ${c.border}`,
          borderRadius: 6,
          fontFamily: DP_FONT,
          fontSize: 14,
          color: c.sub,
        },
        columnHeaders: {
          backgroundColor: c.head,
          borderBottom: `1px solid ${c.fieldBorder}`,
          color: c.text,
        },
        columnHeaderTitle: { fontWeight: 600 },
        cell: { borderBottom: `1px solid ${c.fieldBorder}` },
        footerContainer: { borderTop: `1px solid ${c.fieldBorder}` },
      },
    },
  };
}
