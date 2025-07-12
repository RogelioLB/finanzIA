import AnimatedAlert from "./AnimatedAlert";

export default function DeleteAlert({
  show,
  setShow,
  handleDelete,
}: {
  show: boolean;
  setShow: (value: boolean) => void;
  handleDelete: () => void;
}) {
  return (
    <AnimatedAlert
      visible={show}
      title="Confirmar eliminación"
      message="¿Estás seguro que deseas eliminar esta cuenta?"
      confirmText="Eliminar"
      cancelText="Cancelar"
      confirmButtonColor="#CD5C5C"
      cancelButtonColor="#7952FC"
      onConfirm={handleDelete}
      onCancel={() => setShow(false)}
      onDismiss={() => setShow(false)}
    />
  );
}
