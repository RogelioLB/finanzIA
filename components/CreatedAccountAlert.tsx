import AnimatedAlert from "./AnimatedAlert";

export default function CreatedAccountAlert({
  show,
  setShow,
}: {
  show: boolean;
  setShow: (value: boolean) => void;
}) {
  return (
    <AnimatedAlert
      visible={show}
      title="Cuenta creada"
      message="Cuenta creada exitosamente"
      confirmText="Aceptar"
      confirmButtonColor="#DD6B55"
      onConfirm={() => setShow(false)}
      onDismiss={() => setShow(false)}
    />
  );
}
