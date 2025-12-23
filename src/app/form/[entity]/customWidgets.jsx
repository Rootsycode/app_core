import {
  TextField,
  NumberField,
  Checkbox,
  Select,
  Utility
} from 'rootsy-feparts'

// Input de texto personalizado
const CustomTextWidget = (props) => {
  const errorMessage = props.rawErrors?.[0] || ""; // Captura el primer error si existe
  const hasError = !!errorMessage; // Convierte en booleano

  return (
    <TextField
      label={props.label}
      value={props.value || ""}
      onChange={(e) => props.onChange(e)}
      placeholder={props.placeholder || ""}
      description={props.description}
      isRequired={props.required}
      validationState={hasError ? "invalid" : "valid"} // Resalta el input en rojo
      errorMessage={hasError ? errorMessage : undefined} // Muestra el error solo si existe
    />
  );
};



// Campo de número personalizado
const CustomNumberWidget = (props) => {
  return (
    <NumberField
      label={props.label}
      value={props.value || 0}
      onChange={value => props.onChange(value)}
      description={props.description}
      isRequired={props.required}
    />
  )
}

// Checkbox personalizado
const CustomCheckboxWidget = (props) => {
  return (
    <>
      <Utility size='lg'>{props.label}</Utility>
      <Checkbox
        isSelected={props.value || false}
        onChange={value => props.onChange(value)}
        label={props.label}
      />
    </>
  )
}

// Select personalizado
const CustomSelectWidget = (props) => {
  return (
    <Select
      label={props.label}
      selectedKey={props.value}
      onSelectionChange={value => props.onChange(value)}
      options={props.options?.enumOptions?.map(opt => ({
        label: opt.label,
        value: opt.value
      }))}
    />
  )
}

// TextArea personalizado (para strings largas)
const CustomTextAreaWidget = (props) => {
  return (
    <TextField
      label={props.label}
      placeholder={props.placeholder || ''}
      value={props.value || ''}
      onChange={e => props.onChange(e)}
      description={props.description}
      isRequired={props.required}
      multiline // Habilita textarea en react-aria
    />
  )
}

// Objeto con todos los widgets personalizados
export const CustomWidgets = {
  TextWidget: CustomTextWidget,
  NumberWidget: CustomNumberWidget,
  CheckboxWidget: CustomCheckboxWidget,
  SelectWidget: CustomSelectWidget,
  TextAreaWidget: CustomTextAreaWidget
}
