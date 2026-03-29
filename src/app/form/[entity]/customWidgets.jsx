import {
  TextField,
  NumberField,
  Checkbox,
  Select,
  Utility
} from 'rootsy-feparts'

const CustomTextWidget = (props) => {
  const errorMessage = props.rawErrors?.[0] || ""
  const hasError = !!errorMessage

  return (
    <TextField
      label={props.label}
      value={props.value || ""}
      onChange={(e) => props.onChange(e)}
      placeholder={props.placeholder || ""}
      description={props.description}
      isRequired={props.required}
      validationState={hasError ? "invalid" : "valid"}
      errorMessage={hasError ? errorMessage : undefined}
    />
  );
};



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

const CustomTextAreaWidget = (props) => {
  return (
    <TextField
      label={props.label}
      placeholder={props.placeholder || ''}
      value={props.value || ''}
      onChange={e => props.onChange(e)}
      description={props.description}
      isRequired={props.required}
      multiline
    />
  )
}

export const CustomWidgets = {
  TextWidget: CustomTextWidget,
  NumberWidget: CustomNumberWidget,
  CheckboxWidget: CustomCheckboxWidget,
  SelectWidget: CustomSelectWidget,
  TextAreaWidget: CustomTextAreaWidget
}
